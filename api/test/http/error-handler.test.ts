import "dotenv/config";
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app";
import professionalsService from "../../src/professionals/service/professionals.service";
import { TOKEN_COOKIE } from "../../src/auth/constants/auth.constants";

function authCookie() {
   const token = jwt.sign(
      { id: "user-id", email: "teste@teste.com" },
      process.env.JWT_SECRET!,
   );
   return `${TOKEN_COOKIE}=${token}`;
}

beforeEach(() => {
   mock.restoreAll();
});

describe("rota inexistente", () => {
   test("retorna 404 em JSON", async () => {
      const response = await request(app).get("/rota-que-nao-existe");

      assert.equal(response.status, 404);
      assert.ok(response.body.message);
   });
});

describe("JSON malformado", () => {
   test("retorna 400 em JSON", async () => {
      const response = await request(app)
         .post("/auth/login")
         .set("Content-Type", "application/json")
         .send("{ isso não é json válido");

      assert.equal(response.status, 400);
      assert.ok(response.body.message);
   });
});

describe("erro inesperado no service", () => {
   test("retorna 500 com mensagem genérica, sem vazar detalhe interno", async () => {
      mock.method(professionalsService, "getAll", async () => {
         throw new Error("detalhe interno sensível do banco");
      });

      const response = await request(app)
         .get("/professionals")
         .set("Cookie", authCookie());

      assert.equal(response.status, 500);
      assert.equal(response.body.message, "Erro interno do servidor");
   });
});
