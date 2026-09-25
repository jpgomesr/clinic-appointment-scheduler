import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { logger } from "../logger/logger";

type PgErrorMapping = { status: number; message: string };

// mapeamento primário por nome de constraint: evita assumir que um código
// Postgres (ex: 23505) só pode vir de uma única constraint no banco
const pgErrorsByConstraint: Record<string, PgErrorMapping> = {
   appointments_no_overlap: {
      status: 409,
      message: "Horário já ocupado para esse profissional",
   },
   appointments_professional_id_professionals_id_fk: {
      status: 400,
      message: "Profissional não encontrado",
   },
   users_email_active_unique: { status: 409, message: "Email já cadastrado" },
   appointments_end_after_start: {
      status: 400,
      message: "A data e hora de início deve ser anterior ao término",
   },
};

// fallback por código, usado apenas quando o driver não informa a constraint
const pgErrorsByCode: Record<string, PgErrorMapping> = {
   "23P01": pgErrorsByConstraint.appointments_no_overlap!,
   "23503": pgErrorsByConstraint.appointments_professional_id_professionals_id_fk!,
   "23505": pgErrorsByConstraint.users_email_active_unique!,
   "23514": pgErrorsByConstraint.appointments_end_after_start!,
};

function mapPgError(cause: unknown): PgErrorMapping | undefined {
   if (!cause || typeof cause !== "object" || !("code" in cause)) return undefined;
   const { code, constraint } = cause as { code?: string; constraint?: string };
   if (!code) return undefined;

   // constraint presente mas desconhecida: não reaproveita a mensagem do
   // código, para não misturar violações de constraints diferentes
   if (constraint) return pgErrorsByConstraint[constraint];

   return pgErrorsByCode[code];
}

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

   const pgError = err instanceof Error ? mapPgError(err.cause) : undefined;
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
