import { z } from "zod";

export const appointmentType = z
   .object({
      startAt: z.coerce.date(),
      endAt: z.coerce.date(),
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
   from: z.coerce.date().optional(),
   to: z.coerce.date().optional(),
});

export type AppointmentFilterDto = z.infer<typeof appointmentFilterType>;
