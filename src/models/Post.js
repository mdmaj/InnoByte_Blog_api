import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      minlength: 1,
      maxlength: 20000,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;