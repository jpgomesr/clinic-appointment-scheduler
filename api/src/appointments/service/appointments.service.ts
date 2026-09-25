import { AppointmentDto, AppointmentFilterDto } from "../dto/appointment.dto";
import appointmentsRepository from "../repository/appointments.repository";
import { AppError } from "../../shared/errors/app-error";

const appointmentsService = {
   create: async (appointmentDto: AppointmentDto) => {
      const exist = await appointmentsRepository.findConflict(appointmentDto);
      if (exist)
         throw AppError.conflict("Horário já ocupado para esse profissional");

      // insert sem WHERE sempre retorna 1 linha, a menos que lance (ex.: 23P01)
      const [appointment] = await appointmentsRepository.insert(appointmentDto);

      return appointment!;
   },

   delete: async (appointmentId: string) => {
      const [appointment] =
         await appointmentsRepository.softDelete(appointmentId);

      if (!appointment) throw AppError.notFound("Agendamento não encontrado");

      return appointment;
   },

   edit: async (appointmentId: string, appointmentDto: AppointmentDto) => {
      const current = await appointmentsRepository.findById(appointmentId);
      if (!current) throw AppError.notFound("Agendamento não encontrado");

      const exist = await appointmentsRepository.findConflict(
         appointmentDto,
         appointmentId,
      );
      if (exist)
         throw AppError.conflict("Horário já ocupado para esse profissional");

      const [appointment] = await appointmentsRepository.edit(
         appointmentId,
         appointmentDto,
      );

      if (!appointment) throw AppError.notFound("Agendamento não encontrado");

      return appointment;
   },

   get: async (appointmentId: string) => {
      const appointment = await appointmentsRepository.findById(appointmentId);
      if (!appointment) throw AppError.notFound("Agendamento não encontrado");

      return appointment;
   },

   getAll: async (filter: AppointmentFilterDto = {}) => {
      const { professionalId, from, to } = filter;

      const appointmentsList =
         await appointmentsRepository.findByProfessionalIdAndDate(
            professionalId,
            from,
            to,
         );
      return appointmentsList;
   },
};

export default appointmentsService;
