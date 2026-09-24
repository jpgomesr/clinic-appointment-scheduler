import "dotenv/config";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { TOKEN_COOKIE } from "../constants/auth.constants";
import { AppError } from "../../shared/errors/app-error";
import authRepository from "../repository/auth.repository";

export async function authToken(
   req: Request,
   res: Response,
   next: NextFunction,
) {
   const token = req.cookies?.[TOKEN_COOKIE];

   if (!token) return next(AppError.unauthorized("Token não fornecido"));

   try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      const user = await authRepository.getById(payload.id as string);
      if (!user)
         return next(AppError.unauthorized("Token inválido ou expirado"));
      req.user = payload;
      next();
   } catch {
      next(AppError.unauthorized("Token inválido ou expirado"));
   }
}
