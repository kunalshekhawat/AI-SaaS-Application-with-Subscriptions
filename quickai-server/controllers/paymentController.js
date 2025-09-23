import Stripe from 'stripe';
import { clerkClient } from "@clerk/express";

// Initialize Stripe with your test key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// Create payment intent for premium subscription
export const createPaymentIntent = async (req, res) => {
    try {
        const userId = req.userId; // Set by simpleAuth middleware
        
        console.log('Creating payment intent for user:', userId);

        const user = await clerkClient.users.getUser(userId);
        console.log('User data retrieved for payment:', user.id);

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1900, // ₹19 in paisa
            currency: 'inr',
            metadata: {
                user_id: userId,
                plan: 'premium',
                user_email: user.emailAddresses[0]?.emailAddress || '',
                user_name: (user.firstName + ' ' + user.lastName).trim() || 'User'
            },
            description: 'Quick.ai Premium Monthly Subscription'
        });
        
        console.log('Payment intent created successfully:', paymentIntent.id);

        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
        });

    } catch (error) {
        console.error("Payment intent creation error:", error);
        res.json({
            success: false,
            message: `Failed to create payment intent: ${error.message}`
        });
    }
};

// Confirm payment and upgrade user
export const confirmPayment = async (req, res) => {
    try {
        const userId = req.userId; // Set by simpleAuth middleware
        const { payment_intent_id } = req.body;

        console.log('Confirming payment for user:', userId, 'Payment Intent:', payment_intent_id);

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

        if (paymentIntent.status !== 'succeeded') {
            console.log('Payment not successful:', paymentIntent.status);
            return res.json({
                success: false,
                message: `Payment not completed. Status: ${paymentIntent.status}`
            });
        }

        // Verify that the payment belongs to this user
        if (paymentIntent.metadata.user_id !== userId) {
            console.log('Payment user mismatch');
            return res.json({
                success: false,
                message: "Payment verification failed - user mismatch"
            });
        }

        // Payment successful - upgrade user to premium
        const now = new Date();
        const subscriptionStart = now.toISOString();
        const subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

        await clerkClient.users.updateUser(userId, {
            privateMetadata: {
                plan: 'premium',
                subscription_type: 'monthly',
                subscription_status: 'active',
                subscription_start: subscriptionStart,
                subscription_end: subscriptionEnd,
                upgraded_at: subscriptionStart,
                free_usage: 0,
                monthly_usage: 0,
                max_monthly_usage: -1, // Unlimited
                billing_cycle: 'monthly',
                amount_paid: 19,
                currency: 'INR',
                payment_method: 'stripe_card',
                stripe_payment_intent: payment_intent_id,
                stripe_payment_status: 'succeeded'
            }
        });

        console.log('User upgraded to premium successfully:', userId);

        res.json({
            success: true,
            message: "Payment successful! You've been upgraded to Premium plan for 30 days.",
            plan: "premium",
            subscription: {
                type: 'monthly',
                status: 'active',
                start_date: subscriptionStart,
                end_date: subscriptionEnd,
                amount_paid: 19,
                currency: 'INR',
                days_remaining: 30
            }
        });

    } catch (error) {
        console.error("Payment confirmation error:", error);
        res.json({
            success: false,
            message: `Payment confirmation failed: ${error.message}`
        });
    }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.userId; // Set by simpleAuth middleware

        const user = await clerkClient.users.getUser(userId);
        const metadata = user.privateMetadata || {};
        
        const history = [];
        
        if (metadata.stripe_payment_intent && metadata.upgraded_at) {
            history.push({
                type: 'payment',
                plan: 'premium',
                date: metadata.upgraded_at,
                amount: metadata.amount_paid || 19,
                currency: metadata.currency || 'INR',
                payment_intent_id: metadata.stripe_payment_intent,
                status: metadata.stripe_payment_status || 'succeeded'
            });
        }

        res.json({
            success: true,
            history: history,
            current_plan: metadata.plan || 'free'
        });

    } catch (error) {
        console.error("Payment history error:", error);
        res.json({
            success: false,
            message: `Failed to get payment history: ${error.message}`
        });
    }
};