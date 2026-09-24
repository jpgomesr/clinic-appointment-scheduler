import { Request, Response } from "express";
import { ZodError } from "zod";
import appointmentsService from "../service/appointments.service";
import {
   appointmentFilterType,
   appointmentIdType,
   appointmentType,
} from "../dto/appointment.dto";

const appointmentsController = {
   create: async (req: Request, res: Response) => {
      try {
         const appointmentDto = appointmentType.parse(req.body);
         const appointment = await appointmentsService.create(appointmentDto);
         req.app.locals.io?.emit("appointment:created", appointment);
         res.status(201).json({ appointment });
      } catch (error: any) {
         if (error instanceof ZodError) {
            return res.status(400).json({
               message: error.issues.map((issue) => issue.message).join(", "),
            });
         }
         res.status(error.status ?? 500).json({ message: error.message });
      }
   },

   delete: async (req: Request, res: Response) => {
      try {
         const appointmentId = appointmentIdType.parse(req.params.id);
         const appointment = await appointmentsService.delete(appointmentId);
         req.app.locals.io?.emit("appointment:cancelled", appointment);
         res.status(200).json({ appointment });
      } catch (error: any) {
         if (error instanceof ZodError) {
            return res.status(400).json({
               message: error.issues.map((issue) => issue.message).join(", "),
            });
         }
         res.status(error.status ?? 500).json({ message: error.message });
      }
   },

   edit: async (req: Request, res: Response) => {
      try {
         const appointmentId = appointmentIdType.parse(req.params.id);
         const appointmentDto = appointmentType.parse(req.body);
         const appointment = await appointmentsService.edit(
            appointmentId,
            appointmentDto,
         );
         req.app.locals.io?.emit("appointment:updated", appointment);
         res.status(200).json({ appointment });
      } catch (error: any) {
         if (error instanceof ZodError) {
            return res.status(400).json({
               message: error.issues.map((issue) => issue.message).join(", "),
            });
         }
         res.status(error.status ?? 500).json({ message: error.message });
      }
   },

   get: async (req: Request, res: Response) => {
      try {
         const appointmentId = appointmentIdType.parse(req.params.id);
         const appointment = await appointmentsService.get(appointmentId);
         res.status(200).json({ appointment });
      } catch (error: any) {
         if (error instanceof ZodError) {
            return res.status(400).json({
               message: error.issues.map((issue) => issue.message).join(", "),
            });
         }
         res.status(error.status ?? 500).json({ message: error.message });
      }
   },

   getAll: async (req: Request, res: Response) => {
      try {
         const filter = appointmentFilterType.parse(req.query);
         const appointments = await appointmentsService.getAll(filter);
         res.status(200).json({ appointments });
      } catch (error: any) {
         if (error instanceof ZodError) {
            return res.status(400).json({
               message: error.issues.map((issue) => issue.message).join(", "),
            });
         }
         res.status(error.status ?? 500).json({ message: error.message });
      }
   },
};

export default appointmentsController;
