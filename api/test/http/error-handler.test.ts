import "dotenv/config";
import { randomUUID } from "node:crypto";
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app";
import professionalsService from "../../src/professionals/service/professionals.service";
import appointmentsRepository from "../../src/appointments/repository/appointments.repository";
import { TOKEN_COOKIE } from "../../src/auth/constants/auth.constants";
import authRepository from "../../src/auth/repository/auth.repository";

function authCookie() {
   const token = jwt.sign(
      { id: "user-id", email: "teste@teste.com" },
      process.env.JWT_SECRET!,
   );
   return `${TOKEN_COOKIE}=${token}`;
}

beforeEach(() => {
   mock.restoreAll();
   mock.method(authRepository, "getById", async () => ({
      id: "user-id",
      name: "Teste",
      email: "teste@teste.com",
   }));
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

describe("conflito de exclusion constraint no Postgres (23P01)", () => {
   test("retorna 409 quando o Postgres rejeita por overlap", async () => {
      mock.method(
         appointmentsRepository,
         "findConflict",
         async () => undefined,
      );
      mock.method(appointmentsRepository, "insert", async () => {
         throw Object.assign(new Error("exclusion constraint violation"), {
            cause: { code: "23P01" },
         });
      });

      const response = await request(app)
         .post("/appointments")
         .set("Cookie", authCookie())
         .send({
            startAt: "2026-01-05T09:00:00.000Z",
            endAt: "2026-01-05T10:00:00.000Z",
            professionalId: randomUUID(),
         });

      assert.equal(response.status, 409);
      assert.equal(
         response.body.message,
         "Horário já ocupado para esse profissional",
      );
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
