import "dotenv/config";
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { TransactionRollbackError } from "drizzle-orm";
import { db, pool } from "../../src/db/client";
import { appointments, professionals, users } from "../../src/db/schema";

after(async () => {
   await pool.end();
});

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function createProfessional(tx: Tx) {
   const [p] = await tx
      .insert(professionals)
      .values({ name: "Dra. Teste" })
      .returning();
   return p!.id;
}

describe("appointments_no_overlap (EXCLUDE constraint real no Postgres)", () => {
   test("rejeita overlap real do mesmo profissional com 23P01", async () => {
      await assert.rejects(
         db.transaction(async (tx) => {
            const professionalId = await createProfessional(tx);
            await tx.insert(appointments).values({
               professionalId,
               startAt: new Date("2027-01-05T09:00:00.000Z"),
               endAt: new Date("2027-01-05T10:00:00.000Z"),
            });
            await tx.insert(appointments).values({
               professionalId,
               startAt: new Date("2027-01-05T09:30:00.000Z"),
               endAt: new Date("2027-01-05T10:30:00.000Z"),
            });
         }),
         (err: any) => {
            assert.equal(err.cause?.code, "23P01");
            assert.equal(err.cause?.constraint, "appointments_no_overlap");
            return true;
         },
      );
   });

   test("permite ranges apenas tocando [09:00,10:00) e [10:00,11:00)", async () => {
      await assert.rejects(
         db.transaction(async (tx) => {
            const professionalId = await createProfessional(tx);
            await tx.insert(appointments).values({
               professionalId,
               startAt: new Date("2027-01-06T09:00:00.000Z"),
               endAt: new Date("2027-01-06T10:00:00.000Z"),
            });
            await tx.insert(appointments).values({
               professionalId,
               startAt: new Date("2027-01-06T10:00:00.000Z"),
               endAt: new Date("2027-01-06T11:00:00.000Z"),
            });
            tx.rollback();
         }),
         TransactionRollbackError,
      );
   });

   test("permite overlap quando uma das linhas está com deleted_at preenchido", async () => {
      await assert.rejects(
         db.transaction(async (tx) => {
            const professionalId = await createProfessional(tx);
            await tx.insert(appointments).values({
               professionalId,
               startAt: new Date("2027-01-07T09:00:00.000Z"),
               endAt: new Date("2027-01-07T10:00:00.000Z"),
               deletedAt: new Date(),
            });
            await tx.insert(appointments).values({
               professionalId,
               startAt: new Date("2027-01-07T09:00:00.000Z"),
               endAt: new Date("2027-01-07T10:00:00.000Z"),
            });
            tx.rollback();
         }),
         TransactionRollbackError,
      );
   });

   test("permite overlap de horário entre profissionais diferentes", async () => {
      await assert.rejects(
         db.transaction(async (tx) => {
            const professionalIdA = await createProfessional(tx);
            const professionalIdB = await createProfessional(tx);
            await tx.insert(appointments).values({
               professionalId: professionalIdA,
               startAt: new Date("2027-01-08T09:00:00.000Z"),
               endAt: new Date("2027-01-08T10:00:00.000Z"),
            });
            await tx.insert(appointments).values({
               professionalId: professionalIdB,
               startAt: new Date("2027-01-08T09:00:00.000Z"),
               endAt: new Date("2027-01-08T10:00:00.000Z"),
            });
            tx.rollback();
         }),
         TransactionRollbackError,
      );
   });
});

describe("appointments_professional_id_professionals_id_fk (FK real no Postgres)", () => {
   test("rejeita professional_id inexistente com 23503", async () => {
      await assert.rejects(
         db.transaction(async (tx) => {
            await tx.insert(appointments).values({
               professionalId: "00000000-0000-0000-0000-000000000000",
               startAt: new Date("2027-01-09T09:00:00.000Z"),
               endAt: new Date("2027-01-09T10:00:00.000Z"),
            });
         }),
         (err: any) => {
            assert.equal(err.cause?.code, "23503");
            assert.equal(
               err.cause?.constraint,
               "appointments_professional_id_professionals_id_fk",
            );
            return true;
         },
      );
   });
});

describe("users_email_active_unique (índice único parcial real no Postgres)", () => {
   test("rejeita e-mail duplicado ativo com 23505", async () => {
      await assert.rejects(
         db.transaction(async (tx) => {
            await tx.insert(users).values({
               name: "Usuário 1",
               email: "duplicado-dbtest@teste.com",
               password: "hash",
            });
            await tx.insert(users).values({
               name: "Usuário 2",
               email: "duplicado-dbtest@teste.com",
               password: "hash",
            });
         }),
         (err: any) => {
            assert.equal(err.cause?.code, "23505");
            assert.equal(err.cause?.constraint, "users_email_active_unique");
            return true;
         },
      );
   });
});

describe("appointments_end_after_start (CHECK real no Postgres)", () => {
   test("rejeita end_at <= start_at com 23514", async () => {
      await assert.rejects(
         db.transaction(async (tx) => {
            const professionalId = await createProfessional(tx);
            await tx.insert(appointments).values({
               professionalId,
               startAt: new Date("2027-01-10T10:00:00.000Z"),
               endAt: new Date("2027-01-10T09:00:00.000Z"),
            });
         }),
         (err: any) => {
            assert.equal(err.cause?.code, "23514");
            assert.equal(err.cause?.constraint, "appointments_end_after_start");
            return true;
         },
      );
   });
});
