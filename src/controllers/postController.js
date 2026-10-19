import mongoose from "mongoose";
import Post from "../models/Post.js";
import {
  createPostSchema,
  updatePostSchema,
} from "../validators/postValidator.js";

export const createPost = async (req, res) => {
  try {
    const result = createPostSchema.safeParse(req.body);

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

    const post = await Post.create({
      ...result.data,
      author: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: { post },
    });
  } catch (error) {
    console.error("Create post error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "name")
      .lean();

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: { posts },
    });
  } catch (error) {
    console.error("Get posts error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await Post.findById(req.params.id)
      .populate("author", "name")
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error("Get post error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const result = updatePostSchema.safeParse(req.body);

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

    const post = await Post.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user.id,
      },
      { $set: result.data },
      { 
        returnDocument: "after", 
        runValidators: true 
    },
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not authorized to update it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: { post },
    });
  } catch (error) {
    console.error("Update post error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user.id,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not authorized to delete it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
