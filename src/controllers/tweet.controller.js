import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  let { content } = req.body;
  content = content?.trim();

  if (!content) {
    throw new ApiError(400, "Content should not be empty");
  }

  const tweet = await Tweet.create({
    owner: req.user._id,
    content,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweeted successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const tweets = await Tweet.find({
    owner: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);

  if (tweet === null) {
    throw new ApiError(400, `Tweet with id='${tweetId}' not found`);
  }

  if (!tweet.owner.equals(req.user._id)) {
    throw new ApiError(400, "Can not update tweet not created by you");
  }

  let { content } = req.body;
  content = content?.trim();

  if (!content) {
    throw new ApiError(400, "Content should not be empty");
  }

  const tweet_updated = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, tweet_updated, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);

  if (tweet === null) {
    throw new ApiError(400, `Tweet with id='${tweetId}' not found`);
  }

  if (!tweet.owner.equals(req.user._id)) {
    throw new ApiError(400, "Can not delete tweet not created by you");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
