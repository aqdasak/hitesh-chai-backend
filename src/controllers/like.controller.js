import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, `Video with ID=${videoId} not found`);
  }

  const likeObj = {
    video: videoId,
    likedBy: req.user._id,
  };

  const like = await Like.findOneAndDelete(likeObj);

  if (like) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video like removed successfully"));
  }

  Like.create(likeObj);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, `Comment with ID=${commentId} not found`);
  }

  const likeObj = {
    comment: commentId,
    likedBy: req.user._id,
  };
  const like = await Like.findOneAndDelete(likeObj);

  if (like) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment like removed successfully"));
  }

  Like.create(likeObj);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, `Tweet with ID=${tweetId} not found`);
  }

  const likeObj = {
    tweet: tweetId,
    likedBy: req.user._id,
  };

  const like = await Like.findOneAndDelete(likeObj);

  if (like) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet like removed successfully"));
  }

  Like.create(likeObj);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  let likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        localField: "video",
        foreignField: "_id",
        from: "videos",
        as: "video",
      },
    },
    {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },
    {
      $project: {
        video: 1,
      },
    },
  ]);

  likedVideos = likedVideos.map((likedVideos) => {
    return likedVideos.video;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked video fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
