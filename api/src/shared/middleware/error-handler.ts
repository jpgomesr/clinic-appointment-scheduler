import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { logger } from "../logger/logger";

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

   if (err instanceof Error && (err.cause as any)?.code === "23P01") {
      return res.status(409).json({
         message: "Horário já ocupado para esse profissional",
      });
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
