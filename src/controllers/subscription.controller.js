import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscription = await Subscription.findOneAndDelete({
    $and: [{ channel: channelId, subscriber: req.user._id }],
  });

  if (subscription) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Channel unsubscribed successfully"));
  } else {
    Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Channel subscribed successfully"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  let subscriptions = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        localField: "subscriber",
        foreignField: "_id",
        from: "users",
        as: "subscriber",

        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: {
          $first: "$subscriber",
        },
      },
    },
    {
      $project: {
        subscriber: 1,
      },
    },
  ]);

  subscriptions = subscriptions.map((subscription) => {
    return subscription.subscriber;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscriptions, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  let subscriptions = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        localField: "channel",
        foreignField: "_id",
        from: "users",
        as: "subscribedChannel",

        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscribedChannel: {
          $first: "$subscribedChannel",
        },
      },
    },
    {
      $project: {
        subscribedChannel: 1,
      },
    },
  ]);

  subscriptions = subscriptions.map((subscription) => {
    return subscription.subscribedChannel;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
