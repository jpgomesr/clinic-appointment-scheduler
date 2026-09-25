import "dotenv/config";
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app";
import appointmentsRepository from "../../src/appointments/repository/appointments.repository";
import { TOKEN_COOKIE } from "../../src/auth/constants/auth.constants";
import authRepository from "../../src/auth/repository/auth.repository";

const professionalId = "887e2f72-cd78-410f-8ada-442e50fb0d42";
const appointmentBody = {
   startAt: "2026-01-05T09:00:00.000Z",
   endAt: "2026-01-05T10:00:00.000Z",
   professionalId,
};

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

describe("POST /appointments", () => {
   test("retorna 401 sem cookie de autenticação", async () => {
      const response = await request(app)
         .post("/appointments")
         .send(appointmentBody);

      assert.equal(response.status, 401);
   });

   test("retorna 201 quando não há conflito de horário", async () => {
      const created = { id: "new-id", ...appointmentBody };
      mock.method(appointmentsRepository, "findConflict", async () => undefined);
      mock.method(appointmentsRepository, "insert", async () => [created]);

      const response = await request(app)
         .post("/appointments")
         .set("Cookie", authCookie())
         .send(appointmentBody);

      assert.equal(response.status, 201);
      assert.equal(response.body.appointment.id, "new-id");
   });

   test("retorna 409 quando já existe agendamento no mesmo horário", async () => {
      mock.method(appointmentsRepository, "findConflict", async () => ({
         id: "existing",
      }));

      const response = await request(app)
         .post("/appointments")
         .set("Cookie", authCookie())
         .send(appointmentBody);

      assert.equal(response.status, 409);
      assert.match(response.body.message, /ocupado/i);
   });
});
