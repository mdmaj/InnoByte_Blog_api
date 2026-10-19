import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

const router = Router();

router.post("/posts/:postId/comments", authMiddleware, createComment);
router.get("/posts/:postId/comments", getPostComments);

router.patch("/comments/:id", authMiddleware, updateComment);
router.delete("/comments/:id", authMiddleware, deleteComment);

export default router;