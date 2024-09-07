import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  // get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const totalCommentsOnVideo = await Comment.countDocuments({ video: videoId });
  const totalPages = Math.ceil(totalCommentsOnVideo / limitNumber);
  if (totalPages == 0) {
    throw new ApiError(400, "No comment found for the given video");
  }
  if (pageNumber > totalPages) {
    throw new ApiError(400, "Page number exceeds the total pages");
  }

  const comments = await Comment.find({
    video: videoId,
  })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let { content } = req.body;
  content = content?.trim();

  if (!content) {
    throw new ApiError(400, "Content should not be empty");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Tweeted successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  let { content } = req.body;
  content = content?.trim();

  if (!content) {
    throw new ApiError(400, "Content should not be empty");
  }

  const comment = await Comment.findById(commentId);
  if (comment === null) {
    throw new ApiError(400, `Comment with id=${commentId} not found`);
  }
  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(400, "Can not update comment not created by you");
  }

  const comment_updated = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, comment_updated, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (comment === null) {
    throw new ApiError(400, `Comment with id=${commentId} not found`);
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(400, "Can not delete comment not created by you");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
