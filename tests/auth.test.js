import dns from "node:dns/promises";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import "dotenv/config";
import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";

import app from "../src/app.js";
import User from "../src/models/User.js";


let token;
let testEmail;

before(async () => {
  if (!process.env.MONGODB_TEST_URI) {
    throw new Error("MONGODB_TEST_URI is missing from .env");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  await mongoose.connect(process.env.MONGODB_TEST_URI);

  testEmail = `test-${Date.now()}@example.com`;
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    if (testEmail) {
      await User.deleteOne({ email: testEmail });
    }

    await mongoose.disconnect();
  }
});

test("health endpoint returns 200", async () => {
  const response = await request(app)
    .get("/api/v1/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test("register creates a user without exposing password", async () => {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Test User",
      email: testEmail,
      password: "TestPass123",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.user.email, testEmail);
  assert.equal("password" in response.body.data.user, false);
});

test("duplicate email registration returns 409", async () => {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Test User",
      email: testEmail,
      password: "TestPass123",
    });

  assert.equal(response.status, 409);
});

test("login returns a JWT for valid credentials", async () => {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: testEmail,
      password: "TestPass123",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.data.token, "string");

  token = response.body.data.token;
});

test("protected /me route rejects a missing token", async () => {
  const response = await request(app)
    .get("/api/v1/auth/me");

  assert.equal(response.status, 401);
});

test("protected /me route accepts a valid JWT", async () => {
  assert.ok(token, "Login test must provide a JWT first");

  const response = await request(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.user.email, testEmail);
});