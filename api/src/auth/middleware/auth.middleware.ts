import "dotenv/config";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { TOKEN_COOKIE } from "../constants/auth.constants";

export function authToken(req: Request, res: Response, next: NextFunction) {
   const token = req.cookies?.[TOKEN_COOKIE];

   if (!token) return res.sendStatus(401);

   jwt.verify(
      token,
      process.env.JWT_SECRET!,
      (err: VerifyErrors | null, user: JwtPayload | string | undefined) => {
         if (err || !user || typeof user === "string")
            return res.sendStatus(403);
         req.user = user;
         next();
      },
   );
}
