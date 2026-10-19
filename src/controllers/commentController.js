import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../validators/commentValidator.js";

// Create comment
// Supports POST /comments and POST /posts/:postId/comments
export const createComment = async (req, res) => {
  try {
    const postId = req.params.postId || req.body.post_id;

    if (!postId || !mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Valid post_id is required",
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

    const postExists = await Post.exists({ _id: postId });

    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = await Comment.create({
      content: result.data.content,
      post: postId,
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

// Get comments for a post
// Supports GET /comments?post_id=... and GET /posts/:postId/comments
export const getPostComments = async (req, res) => {
  try {
    const postId = req.params.postId || req.query.post_id;

    if (!postId || !mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Valid post_id is required",
      });
    }

    const postExists = await Post.exists({ _id: postId });

    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comments = await Comment.find({ post: postId })
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

// Get one comment by ID
// GET /comments/:id
export const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
    }

    const comment = await Comment.findById(id)
      .populate("author", "name")
      .populate("post", "title")
      .lean();

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { comment },
    });
  } catch (error) {
    console.error("Get comment by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update comment
// Supports PUT and PATCH /comments/:id
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
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
        _id: id,
        author: req.user.id,
      },
      { $set: { content: result.data.content } },
      { returnDocument: "after", runValidators: true },
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

// Delete comment
// DELETE /comments/:id
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
    }

    const comment = await Comment.findOneAndDelete({
      _id: id,
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
