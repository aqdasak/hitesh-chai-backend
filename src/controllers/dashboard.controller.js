import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const stats = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        localField: "_id",
        foreignField: "owner",
        from: "videos",
        as: "videos",

        pipeline: [
          {
            $group: {
              _id: null,
              totalVideos: { $sum: 1 },
              totalViews: { $sum: "$views" },
            },
          },
          {
            $lookup: {
              localField: "_id",
              foreignField: "video",
              from: "likes",
              as: "likes",

              pipeline: [
                {
                  $group: {
                    _id: null,
                    totalLikes: { $sum: 1 },
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              likes: { $first: "$likes" },
            },
          },
        ],
      },
    },
    {
      $lookup: {
        localField: "_id",
        foreignField: "channel",
        from: "subscriptions",
        as: "subscriptions",

        pipeline: [
          {
            $group: {
              _id: null,
              totalSubscribers: { $sum: 1 },
            },
          },
        ],
      },
    },
    // $unwind can also be used in place of $addFields below
    // {
    //   $unwind: {
    //     path: "$videos",
    //   },
    // },
    {
      $addFields: {
        videos: { $first: "$videos" },
      },
    },
    {
      $addFields: {
        subscriptions: { $first: "$subscriptions" },
      },
    },
    {
      $project: {
        username: 1,
        fullname: 1,
        totalVideos: "$videos.totalVideos",
        totalViews: "$videos.totalViews",
        totalLikes: "$videos.likes.totalLikes",
        totalSubscribers: "$subscriptions.totalSubscribers",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, stats[0], "Stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
