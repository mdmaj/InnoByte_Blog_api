import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/postController.js";

const router = Router();

// Public read endpoints
router.get("/", getAllPosts);
router.get("/:id", getPostById);

// Authenticated write endpoints
router.post("/", authMiddleware, createPost);
router.patch("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);

export default router;