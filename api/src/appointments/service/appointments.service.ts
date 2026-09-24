import { AppointmentDto, AppointmentFilterDto } from "../dto/appointment.dto";
import appointmentsRepository from "../repository/appointments.repository";
import { AppError } from "../../shared/errors/app-error";

const appointmentsService = {
   create: async (appointmentDto: AppointmentDto) => {
      const exist = await appointmentsRepository.findConflict(appointmentDto);
      if (exist)
         throw AppError.conflict("Horário já ocupado para esse profissional");

      let appointment;
      try {
         [appointment] = await appointmentsRepository.insert(appointmentDto);
      } catch (error: any) {
         if (error.cause?.code === "23P01") {
            throw AppError.conflict(
               "Horário já ocupado para esse profissional",
            );
         }
         throw new Error("Falha ao agendar horário");
      }

      if (!appointment) throw new Error("Falha ao agendar horário");

      return appointment;
   },

   delete: async (appointmentId: string) => {
      const [appointment] =
         await appointmentsRepository.softDelete(appointmentId);

      if (!appointment) throw AppError.notFound("Agendamento não encontrado");

      return appointment;
   },

   edit: async (appointmentId: string, appointmentDto: AppointmentDto) => {
      const exist = await appointmentsRepository.findConflict(
         appointmentDto,
         appointmentId,
      );
      if (exist)
         throw AppError.conflict("Horário já ocupado para esse profissional");

      let appointment;
      try {
         [appointment] = await appointmentsRepository.edit(
            appointmentId,
            appointmentDto,
         );
      } catch (error: any) {
         if (error.cause?.code === "23P01") {
            throw AppError.conflict(
               "Horário já ocupado para esse profissional",
            );
         }
         throw new Error("Falha ao editar agendamento");
      }

      if (!appointment) throw AppError.notFound("Agendamento não encontrado");

      return appointment;
   },

   get: async (appointmentId: string) => {
      const appointment = await appointmentsRepository.findById(appointmentId);
      if (!appointment) throw AppError.notFound("Agendamento não encontrado");

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

      const appointmentsList =
         await appointmentsRepository.findByProfessionalIdAndDate(
            professionalId,
            startOfDay,
            endOfDay,
         );
      return appointmentsList;
   },
};

export default appointmentsService;
