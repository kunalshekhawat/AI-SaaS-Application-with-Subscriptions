import express from "express";
import { createPaymentIntent, confirmPayment, getPaymentHistory } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// Simple auth middleware for payment routes
const simpleAuth = async (req, res, next) => {
    try {
        const { userId } = await req.auth();
        if (!userId) {
            return res.json({ success: false, message: "User not authenticated" });
        }
        req.userId = userId;
        next();
    } catch (error) {
        console.error('Payment auth error:', error);
        return res.json({ success: false, message: "Authentication failed" });
    }
};

paymentRouter.post('/create-payment-intent', simpleAuth, createPaymentIntent);
paymentRouter.post('/confirm-payment', simpleAuth, confirmPayment);
paymentRouter.get('/history', simpleAuth, getPaymentHistory);

export default paymentRouter;