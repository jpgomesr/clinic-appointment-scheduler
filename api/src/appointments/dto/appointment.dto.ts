import { z } from "zod";

export const appointmentType = z.object({
   startAt: z.coerce.date(),
   endAt: z.coerce.date(),
   professionalId: z.uuid().nonempty(),
});

export type AppointmentDto = z.infer<typeof appointmentType>;

export const appointmentIdType = z.uuid();
