import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createComment,
  getPostComments,
  getCommentById,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

const router = Router();

// Assignment endpoints
router.post("/comments", authMiddleware, createComment);
router.get("/comments", getPostComments);
router.get("/comments/:id", getCommentById);
router.put("/comments/:id", authMiddleware, updateComment);
router.patch("/comments/:id", authMiddleware, updateComment);
router.delete("/comments/:id", authMiddleware, deleteComment);

// Backward-compatible nested endpoints
router.post("/posts/:postId/comments", authMiddleware, createComment);
router.get("/posts/:postId/comments", getPostComments);

export default router;
