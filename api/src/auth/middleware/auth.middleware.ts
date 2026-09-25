import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import authRepository from "../repository/auth.repository";

export function getBearerToken(req: Request) {
   const header = req.headers.authorization;
   if (!header?.startsWith("Bearer ")) return undefined;
   return header.slice("Bearer ".length);
}

export async function authToken(
   req: Request,
   res: Response,
   next: NextFunction,
) {
   const token = getBearerToken(req);

   if (!token) return next(AppError.unauthorized("Token não fornecido"));

   try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const user = await authRepository.getById(payload.id as string);
      if (!user)
         return next(AppError.unauthorized("Token inválido ou expirado"));
      req.user = payload;
      next();
   } catch {
      next(AppError.unauthorized("Token inválido ou expirado"));
   }
}
