import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { logger } from "../logger/logger";

// cada código só vem de uma constraint hoje: appointments_no_overlap (23P01),
// FK appointments.professional_id (23503) e users_email_active_unique (23505)
const pgErrors: Record<string, { status: number; message: string }> = {
   "23P01": { status: 409, message: "Horário já ocupado para esse profissional" },
   "23503": { status: 400, message: "Profissional não encontrado" },
   "23505": { status: 409, message: "Email já cadastrado" },
};

export function errorHandler(
   err: unknown,
   _req: Request,
   res: Response,
   _next: NextFunction,
) {
   if (err instanceof ZodError) {
      return res.status(400).json({
         message: err.issues.map((issue) => issue.message).join(", "),
      });
   }

   if (err instanceof AppError) {
      return res.status(err.status).json({ message: err.message });
   }

   const pgError =
      err instanceof Error ? pgErrors[(err.cause as any)?.code] : undefined;
   if (pgError) {
      return res.status(pgError.status).json({ message: pgError.message });
   }

   if (
      err instanceof SyntaxError &&
      "status" in err &&
      (err as any).status === 400 &&
      "body" in err
   ) {
      return res.status(400).json({ message: "JSON inválido" });
   }

   logger.error(err);
   res.status(500).json({ message: "Erro interno do servidor" });
}
