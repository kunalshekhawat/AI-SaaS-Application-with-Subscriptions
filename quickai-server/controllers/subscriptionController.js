import { clerkClient } from "@clerk/express";

// Upgrade user to premium plan
export const upgradeToPremium = async (req, res) => {
    try {
        console.log('Upgrade to premium request received');
        const { userId } = await req.auth();
        console.log('User ID:', userId);
        
        if (!userId) {
            console.log('No user ID found');
            return res.json({ success: false, message: "User not authenticated" });
        }

        const user = await clerkClient.users.getUser(userId);
        const currentMetadata = user.privateMetadata || {};
        
        // Check if user is already premium
        if (currentMetadata.plan === 'premium' && currentMetadata.subscription_status === 'active') {
            return res.json({ 
                success: false, 
                message: "You are already on the Premium plan" 
            });
        }

        // Calculate subscription dates
        const now = new Date();
        const subscriptionStart = now.toISOString();
        const subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

        console.log('Updating user metadata with monthly subscription...');
        await clerkClient.users.updateUser(userId, {
            privateMetadata: {
                ...currentMetadata,
                plan: 'premium',
                subscription_type: 'monthly',
                subscription_status: 'active',
                subscription_start: subscriptionStart,
                subscription_end: subscriptionEnd,
                upgraded_at: subscriptionStart,
                free_usage: 0,
                monthly_usage: 0,
                max_monthly_usage: -1, // Unlimited for premium
                billing_cycle: 'monthly',
                amount_paid: 19, // ₹19 per month
                currency: 'INR',
                payment_method: 'clerk_monthly_subscription'
            }
        });

        console.log('User upgraded to monthly premium subscription successfully');
        res.json({
            success: true,
            message: "Successfully upgraded to Premium Monthly plan! You now have unlimited access for 30 days.",
            plan: "premium",
            subscription: {
                type: 'monthly',
                status: 'active',
                start_date: subscriptionStart,
                end_date: subscriptionEnd,
                amount: 19,
                currency: 'INR',
                days_remaining: 30
            }
        });

    } catch (error) {
        console.error("Upgrade error:", error);
        res.json({
            success: false,
            message: `Failed to upgrade plan: ${error.message}`
        });
    }
};

// Get user's current subscription status
export const getSubscriptionStatus = async (req, res) => {
    try {
        console.log('Getting subscription status...');
        const { userId, has } = await req.auth();
        console.log('User ID:', userId);
        
        if (!userId) {
            console.log('No user ID found');
            return res.json({ success: false, message: "User not authenticated" });
        }

        const user = await clerkClient.users.getUser(userId);
        const metadata = user.privateMetadata || {};
        console.log('User metadata:', metadata);
        
        // Check if subscription has expired
        let isExpired = false;
        let daysLeft = 0;
        
        if (metadata.subscription_end) {
            const endDate = new Date(metadata.subscription_end);
            const now = new Date();
            daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            isExpired = daysLeft <= 0;
            
            // Auto-downgrade if expired
            if (isExpired && metadata.plan === 'premium') {
                await clerkClient.users.updateUser(userId, {
                    privateMetadata: {
                        ...metadata,
                        plan: 'free',
                        subscription_status: 'expired',
                        expired_at: new Date().toISOString()
                    }
                });
                console.log('Subscription expired, user downgraded to free');
            }
        }

        const currentPlan = isExpired ? 'free' : (metadata.plan || 'free');
        console.log('Final plan status:', currentPlan);
        
        const subscription = {
            plan: currentPlan,
            subscription_type: metadata.subscription_type || 'free',
            status: isExpired ? 'expired' : (metadata.subscription_status || 'inactive'),
            start_date: metadata.subscription_start || null,
            end_date: metadata.subscription_end || null,
            days_left: Math.max(0, daysLeft),
            is_expired: isExpired,
            usage: {
                monthly_usage: metadata.monthly_usage || 0,
                max_monthly_usage: metadata.max_monthly_usage || 10,
                free_usage: metadata.free_usage || 0
            },
            billing: {
                amount: metadata.amount_paid || 0,
                currency: metadata.currency || 'INR',
                cycle: metadata.billing_cycle || 'free'
            },
            upgraded_at: metadata.upgraded_at || null
        };
        
        res.json({
            success: true,
            subscription: subscription
        });

    } catch (error) {
        console.error("Subscription status error:", error);
        res.json({
            success: false,
            message: `Failed to get subscription status: ${error.message}`
        });
    }
};

// Downgrade user to free plan
export const downgradeToFree = async (req, res) => {
    try {
        const { userId } = await req.auth();
        
        if (!userId) {
            return res.json({ success: false, message: "User not authenticated" });
        }

        const user = await clerkClient.users.getUser(userId);
        const currentMetadata = user.privateMetadata || {};

        // Update user's plan to free
        await clerkClient.users.updateUser(userId, {
            privateMetadata: {
                ...currentMetadata,
                plan: 'free',
                subscription_type: 'free',
                subscription_status: 'inactive',
                subscription_start: null,
                subscription_end: null,
                downgraded_at: new Date().toISOString(),
                free_usage: currentMetadata.free_usage || 0,
                monthly_usage: 0,
                max_monthly_usage: 10, // 10 uses per month for free
                billing_cycle: 'free',
                amount_paid: 0,
                payment_method: 'free'
            }
        });

        res.json({
            success: true,
            message: "Successfully downgraded to Free plan",
            plan: "free"
        });

    } catch (error) {
        console.error("Downgrade error:", error);
        res.json({
            success: false,
            message: "Failed to downgrade plan. Please try again."
        });
    }
};

// Renew subscription (extend by 30 days)
export const renewSubscription = async (req, res) => {
    try {
        const { userId } = await req.auth();
        
        if (!userId) {
            return res.json({ success: false, message: "User not authenticated" });
        }

        const user = await clerkClient.users.getUser(userId);
        const currentMetadata = user.privateMetadata || {};
        
        // Calculate new subscription end date
        const now = new Date();
        const currentEnd = currentMetadata.subscription_end ? new Date(currentMetadata.subscription_end) : now;
        const extendFrom = currentEnd > now ? currentEnd : now; // Extend from current end or now if expired
        const newEndDate = new Date(extendFrom.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Add 30 days

        await clerkClient.users.updateUser(userId, {
            privateMetadata: {
                ...currentMetadata,
                plan: 'premium',
                subscription_status: 'active',
                subscription_end: newEndDate,
                renewed_at: now.toISOString(),
                monthly_usage: 0 // Reset monthly usage on renewal
            }
        });

        console.log('Subscription renewed for user:', userId);

        res.json({
            success: true,
            message: "Subscription renewed successfully! You have 30 more days of Premium access.",
            subscription: {
                status: 'active',
                end_date: newEndDate,
                renewed_at: now.toISOString()
            }
        });

    } catch (error) {
        console.error("Subscription renewal error:", error);
        res.json({
            success: false,
            message: `Failed to renew subscription: ${error.message}`
        });
    }
};