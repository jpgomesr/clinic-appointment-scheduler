import { and, eq, gt, gte, isNull, lt, ne } from "drizzle-orm";
import { db } from "../db/client";
import { AppointmentDto, AppointmentFilterDto } from "./dto/appointment.dto";
import { appointments } from "../db/schema";

const appointmentsService = {
   create: async (appointmentDto: AppointmentDto) => {
      const exist = await db.query.appointments.findFirst({
         where: and(
            eq(appointments.professionalId, appointmentDto.professionalId),
            isNull(appointments.deletedAt),
            lt(appointments.startAt, appointmentDto.endAt),
            gt(appointments.endAt, appointmentDto.startAt),
         ),
      });
      if (exist)
         throw Object.assign(
            new Error("Horário já ocupado para esse profissional"),
            {
               status: 409,
            },
         );

      let appointment;
      try {
         [appointment] = await db
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
      } catch (error: any) {
         if (error.cause?.code === "23P01") {
            throw Object.assign(
               new Error("Horário já ocupado para esse profissional"),
               {
                  status: 409,
               },
            );
         }
         throw Object.assign(new Error("Falha ao agendar horário"), {
            status: 500,
         });
      }

      if (!appointment)
         throw Object.assign(new Error("Falha ao agendar horário"), {
            status: 500,
         });

      return appointment;
   },

   delete: async (appointmentId: string) => {
      const [appointment] = await db
         .update(appointments)
         .set({ deletedAt: new Date() })
         .where(
            and(
               eq(appointments.id, appointmentId),
               isNull(appointments.deletedAt),
            ),
         )
         .returning({ id: appointments.id });

      if (!appointment)
         throw Object.assign(new Error("Agendamento não encontrado"), {
            status: 404,
         });

      return appointment;
   },

   edit: async (appointmentId: string, appointmentDto: AppointmentDto) => {
      const exist = await db.query.appointments.findFirst({
         where: and(
            eq(appointments.professionalId, appointmentDto.professionalId),
            isNull(appointments.deletedAt),
            lt(appointments.startAt, appointmentDto.endAt),
            gt(appointments.endAt, appointmentDto.startAt),
            // Removendo o agendamento atual da verificação de conflito
            ne(appointments.id, appointmentId),
         ),
      });
      if (exist)
         throw Object.assign(
            new Error("Horário já ocupado para esse profissional"),
            {
               status: 409,
            },
         );

      let appointment;
      try {
         [appointment] = await db
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
      } catch (error: any) {
         if (error.cause?.code === "23P01") {
            throw Object.assign(
               new Error("Horário já ocupado para esse profissional"),
               {
                  status: 409,
               },
            );
         }
         throw Object.assign(new Error("Falha ao editar agendamento"), {
            status: 500,
         });
      }

      if (!appointment)
         throw Object.assign(new Error("Agendamento não encontrado"), {
            status: 404,
         });

      return appointment;
   },

   get: async (appointmentId: string) => {
      const appointment = await db.query.appointments.findFirst({
         where: and(
            eq(appointments.id, appointmentId),
            isNull(appointments.deletedAt),
         ),
      });
      if (!appointment)
         throw Object.assign(new Error("Agendamento não encontrado"), {
            status: 404,
         });

      return appointment;
   },

   getAll: async (filter: AppointmentFilterDto = {}) => {
      const { professionalId, date } = filter;

      let startOfDay: Date | undefined;
      let endOfDay: Date | undefined;
      if (date) {
         startOfDay = new Date(`${date}T00:00:00.000Z`);
         endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      }

      const appointmentsList = await db.query.appointments.findMany({
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
      return appointmentsList;
   },
};

export default appointmentsService;
