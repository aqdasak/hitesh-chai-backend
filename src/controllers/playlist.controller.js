import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  let { name, description } = req.body;

  name = name?.trim();
  description = description?.trim();
  if (!name) {
    throw new ApiError(400, "Playlist name should not be empty");
  }
  if (!description) {
    throw new ApiError(400, "Playlist description should not be empty");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, `User with ID=${userId} not found`);
  }

  const playlists = await Playlist.find({ owner: userId });
  if (!playlists) {
    throw new ApiError(400, `No playlist found for the userId=${userId}`);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        "Playlists for the given user fetched successfully"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (playlist === null) {
    throw new ApiError(400, `Playlist with id=${playlistId} not found`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (playlist === null) {
    throw new ApiError(400, `Playlist with id=${playlistId} not found`);
  }

  const video = await Video.findById(videoId);
  if (video === null) {
    throw new ApiError(400, `Video with id=${videoId} not found`);
  }

  if (playlist.videos.indexOf(videoId) !== -1) {
    throw new ApiError(400, "Video already present in the playlist");
  }

  playlist.videos.push(videoId);
  const playlist_updated = playlist.save({ new: true });

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video added to the playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (playlist === null) {
    throw new ApiError(400, `Playlist with id=${playlistId} not found`);
  }

  const index = playlist.videos.indexOf(videoId);
  if (index === -1) {
    throw new ApiError(400, "Video not present in the playlist");
  }

  playlist.videos.splice(index, 1);
  const playlist_updated = playlist.save({ new: true });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Video removed from the playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await Playlist.findById(playlistId);

  if (playlist === null) {
    throw new ApiError(400, `Playlist with id='${playlistId}' not found`);
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(400, "Can not delete playlist not created by you");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  let { name, description } = req.body;

  name = name?.trim();
  description = description?.trim();
  if (!name && !description) {
    throw new ApiError(400, "Provide some detail to be updated");
  }

  const playlist = await Playlist.findById(playlistId);
  if (playlist === null) {
    throw new ApiError(400, `Playlist with id='${playlistId}' not found`);
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(400, "Can not update playlist not created by you");
  }

  if (name) {
    playlist.name = name;
  }
  if (description) {
    playlist.description = description;
  }

  const playlist_updated = await playlist.save({ new: true });

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist_updated, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
