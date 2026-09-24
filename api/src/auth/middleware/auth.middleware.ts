import "dotenv/config";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { TOKEN_COOKIE } from "../constants/auth.constants";
import { AppError } from "../../shared/errors/app-error";

export function authToken(req: Request, res: Response, next: NextFunction) {
   const token = req.cookies?.[TOKEN_COOKIE];

   if (!token) return next(AppError.unauthorized("Token não fornecido"));

   jwt.verify(
      token,
      process.env.JWT_SECRET!,
      (err: VerifyErrors | null, user: JwtPayload | string | undefined) => {
         if (err || !user || typeof user === "string")
            return next(AppError.unauthorized("Token inválido ou expirado"));
         req.user = user;
         next();
      },
   );
}
