
import "dotenv/config";
import dns from "node:dns/promises";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Post from "../src/models/Post.js";
import Comment from "../src/models/Comment.js";

let token;
let otherToken;

let userId;
let otherUserId;
let postId;
let commentId;

let testEmail;
let otherEmail;

before(async () => {
  if (!process.env.MONGODB_TEST_URI) {
    throw new Error("MONGODB_TEST_URI is missing from .env");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  await mongoose.connect(process.env.MONGODB_TEST_URI);

  // First test user
  testEmail = `comment-test-${Date.now()}@example.com`;

  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Comment Test User",
      email: testEmail,
      password: "TestPass123",
    });

  assert.equal(registerResponse.status, 201);

  const user = await User.findOne({ email: testEmail });
  assert.ok(user, "First test user should exist");

  userId = user._id;

  const loginResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: testEmail,
      password: "TestPass123",
    });

  assert.equal(loginResponse.status, 200);
  token = loginResponse.body.data.token;

  // Second user for ownership security tests
  otherEmail = `other-comment-test-${Date.now()}@example.com`;

  const otherRegisterResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Other Comment User",
      email: otherEmail,
      password: "TestPass123",
    });

  assert.equal(otherRegisterResponse.status, 201);

  const otherUser = await User.findOne({ email: otherEmail });
  assert.ok(otherUser, "Second test user should exist");

  otherUserId = otherUser._id;

  const otherLoginResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: otherEmail,
      password: "TestPass123",
    });

  assert.equal(otherLoginResponse.status, 200);
  otherToken = otherLoginResponse.body.data.token;

  // Create a post for comment tests
  const postResponse = await request(app)
    .post("/api/v1/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Comment Test Post",
      content: "Post created for comment API tests.",
    });

  assert.equal(postResponse.status, 201);
  postId = postResponse.body.data.post._id;
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    if (postId) {
      await Comment.deleteMany({ post: postId });
      await Post.deleteOne({ _id: postId });
    }

    if (userId) {
      await Comment.deleteMany({ author: userId });
      await Post.deleteMany({ author: userId });
      await User.deleteOne({ _id: userId });
    }

    if (otherUserId) {
      await Comment.deleteMany({ author: otherUserId });
      await Post.deleteMany({ author: otherUserId });
      await User.deleteOne({ _id: otherUserId });
    }

    await mongoose.disconnect();
  }
});

test("creating a comment requires authentication", async () => {
  const response = await request(app)
    .post(`/api/v1/posts/${postId}/comments`)
    .send({
      content: "Unauthenticated comment",
    });

  assert.equal(response.status, 401);
});

test("creating a comment validates the content", async () => {
  const response = await request(app)
    .post(`/api/v1/posts/${postId}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      content: "",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("creating a comment rejects an invalid post ID", async () => {
  const response = await request(app)
    .post("/api/v1/posts/invalid-id/comments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      content: "Test comment",
    });

  assert.equal(response.status, 400);
});

test("authenticated user can create a comment", async () => {
  const response = await request(app)
    .post(`/api/v1/posts/${postId}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      content: "This is a test comment.",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(
    response.body.data.comment.content,
    "This is a test comment."
  );

  commentId = response.body.data.comment._id;

  assert.ok(commentId);
});

test("user can retrieve comments for a post", async () => {
  const response = await request(app)
    .get(`/api/v1/posts/${postId}/comments`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.comments));

  assert.ok(
    response.body.data.comments.some(
      (comment) => comment._id === commentId
    )
  );
});

test("retrieving comments rejects an invalid post ID", async () => {
  const response = await request(app)
    .get("/api/v1/posts/invalid-id/comments");

  assert.equal(response.status, 400);
});

test("comment owner can update their comment", async () => {
  const response = await request(app)
    .patch(`/api/v1/comments/${commentId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      content: "Updated test comment.",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(
    response.body.data.comment.content,
    "Updated test comment."
  );
});

test("another user cannot update someone else's comment", async () => {
  const response = await request(app)
    .patch(`/api/v1/comments/${commentId}`)
    .set("Authorization", `Bearer ${otherToken}`)
    .send({
      content: "Unauthorized comment update.",
    });

  assert.equal(response.status, 404);

  const comment = await Comment.findById(commentId);

  assert.ok(comment, "Comment should still exist");
  assert.equal(comment.content, "Updated test comment.");
});

test("another user cannot delete someone else's comment", async () => {
  const response = await request(app)
    .delete(`/api/v1/comments/${commentId}`)
    .set("Authorization", `Bearer ${otherToken}`);

  assert.equal(response.status, 404);

  const comment = await Comment.findById(commentId);

  assert.ok(comment, "Comment should not be deleted");
});

test("comment owner can delete their comment", async () => {
  const response = await request(app)
    .delete(`/api/v1/comments/${commentId}`)
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);

  const comment = await Comment.findById(commentId);

  assert.equal(comment, null);

  commentId = null;
});
