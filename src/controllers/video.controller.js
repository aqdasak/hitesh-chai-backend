import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // get all videos based on query, sort, pagination

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  // Prepare filter object
  const filter = {};
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    filter.owner = userId;
  }

  // Prepare sort object
  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
  } else {
    sort.createdAt = -1; // Default sort by creation date, newest first
  }

  const totalVideos = await Video.countDocuments(filter);
  const totalPages = Math.ceil(totalVideos / limitNumber);
  if (totalPages == 0) {
    throw new ApiError(400, "No video found for the given query");
  }
  if (pageNumber > totalPages) {
    throw new ApiError(400, "Page number exceeds the total pages");
  }

  const videos = await Video.find(filter)
    .sort(sort)
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  // get video, upload to cloudinary, create video
  let { title, description } = req.body;
  title = title?.trim();
  description = description?.trim();
  if (!title) {
    throw new ApiError(400, "Title is required");
  }
  if (!description) {
    throw new ApiError(400, "Description is required");
  }
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Video file is missing");
  }
  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail file is missing");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail?.url,
    owner: req.user._id,
    title,
    description,
    duration: videoFile.duration,
    views: 0,
    isPublished: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, `Video with ID=${videoId} not found`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  // update video details like title, description, thumbnail
  const { videoId } = req.params;
  let { title, description } = req.body;
  title = title?.trim();
  description = description?.trim();
  const thumbnailLocalPath = req.file?.path;

  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(400, "Provide some detail to be updated");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, `Video with ID=${videoId} not found`);
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(400, "Can not update video not published by you");
  }

  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = description;
  }
  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new ApiError(400, "Error while uploading thumbnail");
    }
    video.thumbnail = thumbnail.url;
  }

  const video_updated = await video.save({ new: true });
  return res
    .status(200)
    .json(new ApiResponse(200, video_updated, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, `Video with ID=${videoId} not found`);
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(400, "Can not delete video not published by you");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
