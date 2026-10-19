import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../validators/commentValidator.js";

export const createComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const result = createCommentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const postExists = await Post.exists({ _id: req.params.postId });

    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = await Comment.create({
      content: result.data.content,
      post: req.params.postId,
      author: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: { comment },
    });
  } catch (error) {
    console.error("Create comment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPostComments = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const postExists = await Post.exists({ _id: req.params.postId });

    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate("author", "name")
      .lean();

    return res.status(200).json({
      success: true,
      count: comments.length,
      data: { comments },
    });
  } catch (error) {
    console.error("Get comments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
    }

    const result = updateCommentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const comment = await Comment.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user.id,
      },
      { $set: { content: result.data.content } },
      { returnDocument: "after", runValidators: true }
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or you are not authorized to update it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: { comment },
    });
  } catch (error) {
    console.error("Update comment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
    }

    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      author: req.user.id,
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or you are not authorized to delete it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};