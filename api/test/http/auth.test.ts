import "dotenv/config";
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app";
import authRepository from "../../src/auth/repository/auth.repository";

beforeEach(() => {
   mock.restoreAll();
});

describe("POST /auth/signup", () => {
   test("retorna 400 quando o body é inválido", async () => {
      const response = await request(app).post("/auth/signup").send({
         name: "",
         email: "not-an-email",
         password: "123",
         confirmPassword: "123",
      });

      assert.equal(response.status, 400);
      assert.ok(response.body.message);
   });

   test("retorna 400 quando as senhas não conferem, sem consultar o banco", async () => {
      const exist = mock.method(authRepository, "exist", async () => undefined);

      const response = await request(app).post("/auth/signup").send({
         name: "Teste",
         email: "teste@teste.com",
         password: "123456",
         confirmPassword: "654321",
      });

      assert.equal(response.status, 400);
      assert.equal(response.body.message, "Senhas não conferem");
      assert.equal(exist.mock.callCount(), 0);
   });
});

describe("autenticação em rota protegida", () => {
   test("retorna 401 em JSON sem token", async () => {
      const response = await request(app).get("/appointments");

      assert.equal(response.status, 401);
      assert.equal(response.body.message, "Token não fornecido");
   });

   test("retorna 401 em JSON com token inválido", async () => {
      const response = await request(app)
         .get("/appointments")
         .set("Authorization", "Bearer token-invalido");

      assert.equal(response.status, 401);
      assert.equal(response.body.message, "Token inválido ou expirado");
   });
});
