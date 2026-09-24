import { Request, Response } from "express";
import appointmentsService from "../service/appointments.service";
import {
   appointmentFilterType,
   appointmentIdType,
   appointmentType,
} from "../dto/appointment.dto";

const appointmentsController = {
   create: async (req: Request, res: Response) => {
      const appointmentDto = appointmentType.parse(req.body);
      const appointment = await appointmentsService.create(appointmentDto);
      req.app.locals.io?.emit("appointment:created", appointment);
      res.status(201).json({ appointment });
   },

   delete: async (req: Request, res: Response) => {
      const appointmentId = appointmentIdType.parse(req.params.id);
      const appointment = await appointmentsService.delete(appointmentId);
      req.app.locals.io?.emit("appointment:cancelled", appointment);
      res.status(200).json({ appointment });
   },

   edit: async (req: Request, res: Response) => {
      const appointmentId = appointmentIdType.parse(req.params.id);
      const appointmentDto = appointmentType.parse(req.body);
      const appointment = await appointmentsService.edit(
         appointmentId,
         appointmentDto,
      );
      req.app.locals.io?.emit("appointment:updated", appointment);
      res.status(200).json({ appointment });
   },

   get: async (req: Request, res: Response) => {
      const appointmentId = appointmentIdType.parse(req.params.id);
      const appointment = await appointmentsService.get(appointmentId);
      res.status(200).json({ appointment });
   },

   getAll: async (req: Request, res: Response) => {
      const filter = appointmentFilterType.parse(req.query);
      const appointments = await appointmentsService.getAll(filter);
      res.status(200).json({ appointments });
   },
};

export default appointmentsController;
