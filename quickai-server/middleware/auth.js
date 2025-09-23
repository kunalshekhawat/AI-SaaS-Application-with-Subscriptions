import { clerkClient } from "@clerk/express";


// Middleware to check userID and hasPremiumPlan

export const auth = async(req, res, next)=>{
    try {
        const {userId, has} = await req.auth();
        const user = await clerkClient.users.getUser(userId);
        
        // Check for premium plan in multiple ways
        let hasPremiumPlan = false;
        
        try {
            // Try Clerk's built-in plan checking first
            hasPremiumPlan = await has({plan: 'premium'});
        } catch (clerkPlanError) {
            // If Clerk plan checking fails, check privateMetadata
            hasPremiumPlan = user.privateMetadata?.plan === 'premium';
        }

        if(!hasPremiumPlan && user.privateMetadata?.free_usage){
            req.free_usage = user.privateMetadata.free_usage
        } else {
            const currentMetadata = user.privateMetadata || {};
            await clerkClient.users.updateUserMetadata(userId,{
                privateMetadata: {
                    ...currentMetadata,
                    free_usage: 0
                }
            })
            req.free_usage = 0;
        }
        req.plan = hasPremiumPlan ? 'premium' : 'free';
        next()
    } catch (error) {
        res.json({success: false, message: error.message})
    }
};
