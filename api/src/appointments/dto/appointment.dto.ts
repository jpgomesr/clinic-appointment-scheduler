import { z } from "zod";

// exige offset explícito (ex.: "Z" ou "+00:00") para não depender do
// fuso horário local do processo, como z.coerce.date() faria
const isoDateWithOffset = z.iso.datetime({ offset: true }).pipe(z.coerce.date());

export const appointmentType = z
   .object({
      startAt: isoDateWithOffset,
      endAt: isoDateWithOffset,
      professionalId: z.uuid(),
   })
   .refine((data) => data.startAt < data.endAt, {
      message: "A data e hora de início deve ser anterior ao término",
      path: ["startAt"], // aponta o erro pro campo certo
   });

export type AppointmentDto = z.infer<typeof appointmentType>;

export const appointmentIdType = z.uuid();

export const appointmentFilterType = z.object({
   professionalId: z.uuid().optional(),
   from: isoDateWithOffset.optional(),
   to: isoDateWithOffset.optional(),
});

export type AppointmentFilterDto = z.infer<typeof appointmentFilterType>;
