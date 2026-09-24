import { and, eq, isNull, lt, gt, gte, ne } from "drizzle-orm";
import { db } from "../../db/client";
import { appointments } from "../../db/schema";
import { AppointmentDto } from "../dto/appointment.dto";

const appointmentsRepository = {
   findConflict: async (appointmentDto: AppointmentDto, excludeId?: string) => {
      return await db.query.appointments.findFirst({
         where: and(
            eq(appointments.professionalId, appointmentDto.professionalId),
            isNull(appointments.deletedAt),
            lt(appointments.startAt, appointmentDto.endAt),
            gt(appointments.endAt, appointmentDto.startAt),
            // Removendo o agendamento atual da verificação de conflito, se houver
            excludeId ? ne(appointments.id, excludeId) : undefined,
         ),
      });
   },

   insert: async (appointmentDto: AppointmentDto) => {
      return await db
         .insert(appointments)
         .values({
            startAt: appointmentDto.startAt,
            endAt: appointmentDto.endAt,
            professionalId: appointmentDto.professionalId,
         })
         .returning({
            id: appointments.id,
            startAt: appointments.startAt,
            endAt: appointments.endAt,
            professionalId: appointments.professionalId,
         });
   },

   edit: async (appointmentId: string, appointmentDto: AppointmentDto) => {
      return await db
         .update(appointments)
         .set({
            startAt: appointmentDto.startAt,
            endAt: appointmentDto.endAt,
            professionalId: appointmentDto.professionalId,
         })
         .where(
            and(
               eq(appointments.id, appointmentId),
               isNull(appointments.deletedAt),
            ),
         )
         .returning({
            id: appointments.id,
            startAt: appointments.startAt,
            endAt: appointments.endAt,
            professionalId: appointments.professionalId,
         });
   },

   softDelete: async (appointmentId: string) => {
      return await db
         .update(appointments)
         .set({ deletedAt: new Date() })
         .where(
            and(
               eq(appointments.id, appointmentId),
               isNull(appointments.deletedAt),
            ),
         )
         .returning({ id: appointments.id });
   },

   findById: async (appointmentId: string) => {
      return await db.query.appointments.findFirst({
         where: and(
            eq(appointments.id, appointmentId),
            isNull(appointments.deletedAt),
         ),
      });
   },

   findByProfessionalIdAndDate: async (
      professionalId?: string,
      startOfDay?: Date,
      endOfDay?: Date,
   ) => {
      return await db.query.appointments.findMany({
         where: and(
            isNull(appointments.deletedAt),
            professionalId
               ? eq(appointments.professionalId, professionalId)
               : undefined,
            startOfDay ? gte(appointments.startAt, startOfDay) : undefined,
            endOfDay ? lt(appointments.startAt, endOfDay) : undefined,
         ),
         orderBy: [appointments.startAt],
      });
   },
};

export default appointmentsRepository;
