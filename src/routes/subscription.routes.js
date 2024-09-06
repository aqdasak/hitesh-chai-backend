import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/c/:channelId")
  // It seems that following controller was mistakenly written. The
  // param used in the function was subscriberId and not channelId
  // .get(getSubscribedChannels) // Original
  .get(getUserChannelSubscribers)
  .post(toggleSubscription);

// router.route("/u/:subscriberId").get(getUserChannelSubscribers);
router.route("/u/:subscriberId").get(getSubscribedChannels);
export default router;
