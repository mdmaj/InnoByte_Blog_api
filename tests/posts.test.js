
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

let token;
let userId;
let postId;
let testEmail;

let otherToken;
let otherUserId;
let otherEmail;

before(async () => {
  if (!process.env.MONGODB_TEST_URI) {
    throw new Error("MONGODB_TEST_URI is missing from .env");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  await mongoose.connect(process.env.MONGODB_TEST_URI);

  // Create first test user
  testEmail = `post-test-${Date.now()}@example.com`;

  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Post Test User",
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

  // Create second test user for ownership security tests
  otherEmail = `other-post-test-${Date.now()}@example.com`;

  const otherRegisterResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Second Test User",
      email: otherEmail,
      password: "TestPass123",
    });

  assert.equal(otherRegisterResponse.status, 201);

  const otherUser = await User.findOne({
    email: otherEmail,
  });

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
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    if (userId) {
      await Post.deleteMany({ author: userId });
      await User.deleteOne({ _id: userId });
    }

    if (otherUserId) {
      await Post.deleteMany({ author: otherUserId });
      await User.deleteOne({ _id: otherUserId });
    }

    await mongoose.disconnect();
  }
});

test("create post requires authentication", async () => {
  const response = await request(app)
    .post("/api/v1/posts")
    .send({
      title: "Test Blog Post",
      content: "This is test content.",
    });

  assert.equal(response.status, 401);
});

test("authenticated user can create a post", async () => {
  const response = await request(app)
    .post("/api/v1/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Test Blog Post",
      content: "This is test content.",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.post.title, "Test Blog Post");

  postId = response.body.data.post._id;
  assert.ok(postId);
});

test("all posts endpoint returns 200", async () => {
  const response = await request(app)
    .get("/api/v1/posts");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.posts));
});

test("get post by ID returns the created post", async () => {
  assert.ok(postId, "Create post test must run first");

  const response = await request(app)
    .get(`/api/v1/posts/${postId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.post._id, postId);
});

test("post owner can update their post", async () => {
  assert.ok(postId, "Create post test must run first");

  const response = await request(app)
    .patch(`/api/v1/posts/${postId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Updated Test Blog Post",
    });

  assert.equal(response.status, 200);
  assert.equal(
    response.body.data.post.title,
    "Updated Test Blog Post"
  );
});

test("another user cannot update someone else's post", async () => {
  assert.ok(postId, "Create post test must run first");

  const response = await request(app)
    .patch(`/api/v1/posts/${postId}`)
    .set("Authorization", `Bearer ${otherToken}`)
    .send({
      title: "Unauthorized Update",
    });

  assert.equal(response.status, 404);

  const post = await Post.findById(postId);

  assert.ok(post, "Original post should still exist");
  assert.equal(post.title, "Updated Test Blog Post");
});

test("another user cannot delete someone else's post", async () => {
  assert.ok(postId, "Create post test must run first");

  const response = await request(app)
    .delete(`/api/v1/posts/${postId}`)
    .set("Authorization", `Bearer ${otherToken}`);

  assert.equal(response.status, 404);

  const post = await Post.findById(postId);

  assert.ok(post, "Post should not be deleted");
});

test("post owner can delete their post", async () => {
  assert.ok(postId, "Create post test must run first");

  const response = await request(app)
    .delete(`/api/v1/posts/${postId}`)
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);

  postId = null;
});
