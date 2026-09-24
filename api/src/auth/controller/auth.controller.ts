import { Request, Response } from "express";
import authService from "../service/auth.service";
import {
   TOKEN_COOKIE,
   TOKEN_COOKIE_OPTIONS,
   TOKEN_MAX_AGE_MS,
} from "../constants/auth.constants";
import { loginType } from "../dto/login.dto";
import { signupType } from "../dto/signup.dto";
import { AppError } from "../../shared/errors/app-error";

const authController = {
   login: async (req: Request, res: Response) => {
      const loginDto = loginType.parse(req.body);
      const { token, user } = await authService.login(loginDto);
      res.cookie(TOKEN_COOKIE, token, {
         ...TOKEN_COOKIE_OPTIONS,
         maxAge: TOKEN_MAX_AGE_MS,
      });
      res.status(200).json({ user });
   },

   signup: async (req: Request, res: Response) => {
      const signupDto = signupType.parse(req.body);
      const { token, user } = await authService.signup(signupDto);
      res.cookie(TOKEN_COOKIE, token, {
         ...TOKEN_COOKIE_OPTIONS,
         maxAge: TOKEN_MAX_AGE_MS,
      });
      res.status(201).json({ user });
   },

   me: async (req: Request, res: Response) => {
      const token = req.cookies?.[TOKEN_COOKIE];
      if (!token) {
         throw AppError.unauthorized("Token não fornecido");
      }
      const user = await authService.me(token);
      res.status(200).json(user);
   },

   logout: async (_req: Request, res: Response) => {
      res.clearCookie(TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS);
      res.status(200).json({ message: "Logout realizado com sucesso" });
   },
};

export default authController;
