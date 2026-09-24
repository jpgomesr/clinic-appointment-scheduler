import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import appointmentsService from "./appointments.service";
import appointmentsRepository from "../repository/appointments.repository";
import { AppointmentDto } from "../dto/appointment.dto";

const appointmentDto: AppointmentDto = {
   startAt: new Date("2026-01-05T09:00:00.000Z"),
   endAt: new Date("2026-01-05T10:00:00.000Z"),
   professionalId: "11111111-1111-1111-1111-111111111111",
};

beforeEach(() => {
   mock.restoreAll();
});

describe("appointmentsService.create", () => {
   test("lança 409 quando já existe conflito de horário", async () => {
      mock.method(appointmentsRepository, "findConflict", async () => ({
         id: "existing",
      }));

      await assert.rejects(
         () => appointmentsService.create(appointmentDto),
         (error: any) => {
            assert.equal(error.status, 409);
            return true;
         },
      );
   });

   test("cria o agendamento quando não há conflito", async () => {
      const created = { id: "new-id", ...appointmentDto };
      mock.method(
         appointmentsRepository,
         "findConflict",
         async () => undefined,
      );
      mock.method(appointmentsRepository, "insert", async () => [created]);

      const result = await appointmentsService.create(appointmentDto);

      assert.deepEqual(result, created);
   });
});

describe("appointmentsService.edit", () => {
   test("lança 409 ao mover para um horário já ocupado", async () => {
      mock.method(appointmentsRepository, "findConflict", async () => ({
         id: "other-appointment",
      }));

      await assert.rejects(
         () => appointmentsService.edit("appointment-id", appointmentDto),
         (error: any) => {
            assert.equal(error.status, 409);
            return true;
         },
      );
   });

   test("edita o agendamento quando não há conflito", async () => {
      const edited = { id: "appointment-id", ...appointmentDto };
      mock.method(
         appointmentsRepository,
         "findConflict",
         async () => undefined,
      );
      mock.method(appointmentsRepository, "edit", async () => [edited]);

      const result = await appointmentsService.edit(
         "appointment-id",
         appointmentDto,
      );

      assert.deepEqual(result, edited);
   });
});
