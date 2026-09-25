import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app";
import healthRepository from "../../src/health/repository/health.repository";

beforeEach(() => {
   mock.restoreAll();
});

describe("GET /health", () => {
   test("retorna 200 quando o banco responde", async () => {
      mock.method(healthRepository, "ping", async () => {});

      const response = await request(app).get("/health");

      assert.equal(response.status, 200);
      assert.equal(response.body.status, "ok");
   });

   test("retorna 503 quando o banco falha", async () => {
      mock.method(healthRepository, "ping", async () => {
         throw new Error("connection refused");
      });

      const response = await request(app).get("/health");

      assert.equal(response.status, 503);
      assert.equal(response.body.status, "unavailable");
   });
});
