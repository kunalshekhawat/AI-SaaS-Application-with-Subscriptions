import express from "express";
import { upgradeToPremium, getSubscriptionStatus, downgradeToFree, renewSubscription } from "../controllers/subscriptionController.js";
import { auth } from "../middleware/auth.js";

const subscriptionRouter = express.Router();

subscriptionRouter.post('/upgrade-premium', auth, upgradeToPremium);
subscriptionRouter.get('/status', auth, getSubscriptionStatus);
subscriptionRouter.post('/downgrade-free', auth, downgradeToFree);
subscriptionRouter.post('/renew', auth, renewSubscription);

export default subscriptionRouter;