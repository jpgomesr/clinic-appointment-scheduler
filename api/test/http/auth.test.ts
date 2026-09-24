import "dotenv/config";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app";

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
});

describe("autenticação em rota protegida", () => {
   test("retorna 401 em JSON sem cookie de token", async () => {
      const response = await request(app).get("/appointments");

      assert.equal(response.status, 401);
      assert.equal(response.body.message, "Token não fornecido");
   });

   test("retorna 401 em JSON com token inválido", async () => {
      const response = await request(app)
         .get("/appointments")
         .set("Cookie", "token=token-invalido");

      assert.equal(response.status, 401);
      assert.equal(response.body.message, "Token inválido ou expirado");
   });
});
