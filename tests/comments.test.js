// tests/comments.test.js

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import "dotenv/config";
import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Post from "../src/models/Post.js";
import Comment from "../src/models/Comment.js";

let firstToken;
let secondToken;
let postId;
let commentId;

const uniqueId = Date.now();

const firstUserData = {
  name: "Comment Test User",
  email: `comment-user-${uniqueId}@example.com`,
  password: "TestPass123",
};

const secondUserData = {
  name: "Second Comment User",
  email: `comment-user-2-${uniqueId}@example.com`,
  password: "TestPass123",
};

async function registerAndLogin(userData) {
  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send(userData);

  assert.equal(
    registerResponse.status,
    201,
    `Registration failed: ${JSON.stringify(registerResponse.body)}`,
  );

  const loginResponse = await request(app).post("/api/v1/auth/login").send({
    email: userData.email,
    password: userData.password,
  });

  assert.equal(
    loginResponse.status,
    200,
    `Login failed: ${JSON.stringify(loginResponse.body)}`,
  );

  const token = loginResponse.body?.data?.token;

  assert.ok(token, "JWT token missing from login response");

  return token;
}

async function createTestPost(token) {
  const response = await request(app)
    .post("/api/v1/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Comment Test Post",
      content: "This post is created for testing comments.",
    });

  assert.equal(
    response.status,
    201,
    `Post creation failed: ${JSON.stringify(response.body)}`,
  );

  const post = response.body?.data?.post ?? response.body?.data;

  assert.ok(post?._id, "Post ID missing from response");

  return post._id;
}

async function createComment(token, content = "A test comment") {
  return request(app)
    .post("/api/v1/comments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      post_id: postId,
      content,
    });
}

function getCommentFromResponse(response) {
  return response.body?.data?.comment ?? response.body?.data;
}

before(async () => {
  if (!process.env.MONGODB_TEST_URI) {
    throw new Error("MONGODB_TEST_URI is missing from .env");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  }

  firstToken = await registerAndLogin(firstUserData);
  secondToken = await registerAndLogin(secondUserData);

  postId = await createTestPost(firstToken);
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    if (postId) {
      await Comment.deleteMany({ post: postId });
      await Post.deleteOne({ _id: postId });
    }

    await User.deleteMany({
      email: {
        $in: [firstUserData.email, secondUserData.email],
      },
    });

    await mongoose.disconnect();
  }
});

test("creating a comment requires authentication", async () => {
  const response = await request(app).post("/api/v1/comments").send({
    post_id: postId,
    content: "Unauthenticated comment",
  });

  assert.equal(response.status, 401);
});

test("creating a comment validates its content", async () => {
  const response = await request(app)
    .post("/api/v1/comments")
    .set("Authorization", `Bearer ${firstToken}`)
    .send({
      post_id: postId,
      content: "",
    });

  assert.ok(
    [400, 422].includes(response.status),
    `Unexpected response: ${JSON.stringify(response.body)}`,
  );
});

test("creating a comment rejects an invalid post ID", async () => {
  const response = await request(app)
    .post("/api/v1/comments")
    .set("Authorization", `Bearer ${firstToken}`)
    .send({
      post_id: "invalid-id",
      content: "Testing an invalid post ID",
    });

  assert.ok(
    [400, 404, 422].includes(response.status),
    `Unexpected response: ${JSON.stringify(response.body)}`,
  );
});

test("authenticated user can create a comment", async () => {
  const response = await createComment(
    firstToken,
    "This is a valid test comment.",
  );

  assert.equal(
    response.status,
    201,
    `Comment creation failed: ${JSON.stringify(response.body)}`,
  );

  const comment = getCommentFromResponse(response);
  assert.ok(comment?._id, "Comment ID missing from response");

  commentId = comment._id;
});

test("user can retrieve comments for a post", async () => {
  const response = await request(app)
    .get("/api/v1/comments")
    .query({ post_id: postId });

  assert.equal(
    response.status,
    200,
    `Retrieving comments failed: ${JSON.stringify(response.body)}`,
  );
});

test("retrieving comments rejects an invalid post ID", async () => {
  const response = await request(app)
    .get("/api/v1/comments")
    .query({ post_id: "invalid-id" });

  assert.ok(
    [400, 422].includes(response.status),
    `Unexpected response: ${JSON.stringify(response.body)}`,
  );
});

test("comment owner can update a comment using PATCH", async () => {
  assert.ok(commentId, "A comment must be created first");

  const response = await request(app)
    .patch(`/api/v1/comments/${commentId}`)
    .set("Authorization", `Bearer ${firstToken}`)
    .send({
      content: "Updated using PATCH",
    });

  assert.equal(
    response.status,
    200,
    `Comment update failed: ${JSON.stringify(response.body)}`,
  );
});

test("another user cannot update someone else's comment", async () => {
  assert.ok(commentId, "A comment must be created first");

  const response = await request(app)
    .patch(`/api/v1/comments/${commentId}`)
    .set("Authorization", `Bearer ${secondToken}`)
    .send({
      content: "Unauthorized update attempt",
    });

  assert.equal(
    response.status,
    404,
    `Expected ownership rejection: ${JSON.stringify(response.body)}`,
  );
});

test("another user cannot delete someone else's comment", async () => {
  assert.ok(commentId, "A comment must be created first");

  const response = await request(app)
    .delete(`/api/v1/comments/${commentId}`)
    .set("Authorization", `Bearer ${secondToken}`);

  assert.equal(
    response.status,
    404,
    `Expected ownership rejection: ${JSON.stringify(response.body)}`,
  );
});

test("comment owner can delete a comment", async () => {
  assert.ok(commentId, "A comment must be created first");

  const response = await request(app)
    .delete(`/api/v1/comments/${commentId}`)
    .set("Authorization", `Bearer ${firstToken}`);

  assert.equal(
    response.status,
    200,
    `Comment deletion failed: ${JSON.stringify(response.body)}`,
  );

  commentId = null;
});

test("user can create a comment using POST /comments", async () => {
  const response = await createComment(
    firstToken,
    "Created using POST /comments",
  );

  assert.equal(
    response.status,
    201,
    `Comment creation failed: ${JSON.stringify(response.body)}`,
  );
});

test("user can retrieve comments using the post_id query parameter", async () => {
  const response = await request(app)
    .get("/api/v1/comments")
    .query({ post_id: postId });

  assert.equal(
    response.status,
    200,
    `Retrieving comments failed: ${JSON.stringify(response.body)}`,
  );
});

test("user can retrieve a single comment by ID", async () => {
  const createResponse = await createComment(
    firstToken,
    "Comment for single-comment retrieval",
  );

  assert.equal(
    createResponse.status,
    201,
    `Comment creation failed: ${JSON.stringify(createResponse.body)}`,
  );

  const comment = getCommentFromResponse(createResponse);
  assert.ok(comment?._id, "Comment ID missing from response");

  const response = await request(app).get(`/api/v1/comments/${comment._id}`);

  assert.equal(
    response.status,
    200,
    `Retrieving comment failed: ${JSON.stringify(response.body)}`,
  );
});

test("comment owner can update a comment using PUT", async () => {
  const createResponse = await createComment(
    firstToken,
    "Comment for PUT test",
  );

  assert.equal(
    createResponse.status,
    201,
    `Comment creation failed: ${JSON.stringify(createResponse.body)}`,
  );

  const comment = getCommentFromResponse(createResponse);
  assert.ok(comment?._id, "Comment ID missing from response");

  const response = await request(app)
    .put(`/api/v1/comments/${comment._id}`)
    .set("Authorization", `Bearer ${firstToken}`)
    .send({
      content: "Updated using PUT",
    });

  assert.equal(
    response.status,
    200,
    `Comment update failed: ${JSON.stringify(response.body)}`,
  );
});
