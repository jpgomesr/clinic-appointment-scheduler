import "dotenv/config";
import { randomUUID } from "node:crypto";
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app";
import professionalsService from "../../src/professionals/service/professionals.service";
import appointmentsRepository from "../../src/appointments/repository/appointments.repository";
import authRepository from "../../src/auth/repository/auth.repository";

function authHeader() {
   const token = jwt.sign(
      { id: "user-id", email: "teste@teste.com" },
      process.env.JWT_SECRET!,
   );
   return `Bearer ${token}`;
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
            cause: { code: "23P01", constraint: "appointments_no_overlap" },
         });
      });

      const response = await request(app)
         .post("/appointments")
         .set("Authorization", authHeader())
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

describe("profissional inexistente (23503)", () => {
   test("retorna 400 quando a FK de professional_id é violada", async () => {
      mock.method(
         appointmentsRepository,
         "findConflict",
         async () => undefined,
      );
      mock.method(appointmentsRepository, "insert", async () => {
         throw Object.assign(new Error("foreign key violation"), {
            cause: {
               code: "23503",
               constraint: "appointments_professional_id_professionals_id_fk",
            },
         });
      });

      const response = await request(app)
         .post("/appointments")
         .set("Authorization", authHeader())
         .send({
            startAt: "2026-01-05T09:00:00.000Z",
            endAt: "2026-01-05T10:00:00.000Z",
            professionalId: randomUUID(),
         });

      assert.equal(response.status, 400);
      assert.equal(response.body.message, "Profissional não encontrado");
   });
});

describe("e-mail duplicado em cadastro concorrente (23505)", () => {
   test("retorna 409 quando o índice único barra o insert", async () => {
      mock.method(authRepository, "exist", async () => undefined);
      mock.method(authRepository, "create", async () => {
         throw Object.assign(new Error("unique violation"), {
            cause: { code: "23505", constraint: "users_email_active_unique" },
         });
      });

      const response = await request(app).post("/auth/signup").send({
         name: "Teste",
         email: "teste@teste.com",
         password: "123456",
         confirmPassword: "123456",
      });

      assert.equal(response.status, 409);
      assert.equal(response.body.message, "Email já cadastrado");
   });
});

describe("constraint desconhecida com código reutilizado (23505)", () => {
   test("retorna 500 genérico, sem reaproveitar a mensagem de e-mail duplicado", async () => {
      mock.method(authRepository, "exist", async () => undefined);
      mock.method(authRepository, "create", async () => {
         throw Object.assign(new Error("unique violation em outra tabela"), {
            cause: { code: "23505", constraint: "outra_constraint_desconhecida" },
         });
      });

      const response = await request(app).post("/auth/signup").send({
         name: "Teste",
         email: "teste@teste.com",
         password: "123456",
         confirmPassword: "123456",
      });

      assert.equal(response.status, 500);
      assert.equal(response.body.message, "Erro interno do servidor");
   });
});

describe("erro inesperado no service", () => {
   test("retorna 500 com mensagem genérica, sem vazar detalhe interno", async () => {
      mock.method(professionalsService, "getAll", async () => {
         throw new Error("detalhe interno sensível do banco");
      });

      const response = await request(app)
         .get("/professionals")
         .set("Authorization", authHeader());

      assert.equal(response.status, 500);
      assert.equal(response.body.message, "Erro interno do servidor");
   });
});
