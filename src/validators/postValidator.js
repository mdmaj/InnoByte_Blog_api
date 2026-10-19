import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters"),

  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(20000, "Content cannot exceed 20000 characters"),
});

export const updatePostSchema = createPostSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update"
  );