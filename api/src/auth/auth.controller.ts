import { Request, Response } from "express";
import authService from "./auth.service";
import {
   TOKEN_COOKIE,
   TOKEN_COOKIE_OPTIONS,
   TOKEN_MAX_AGE_MS,
} from "./auth.constants";

const authController = {
   login: async (req: Request, res: Response) => {
      try {
         const { email, password } = req.body;
         const { token, user } = await authService.login({ email, password });
         res.cookie(TOKEN_COOKIE, token, {
            ...TOKEN_COOKIE_OPTIONS,
            maxAge: TOKEN_MAX_AGE_MS,
         });
         res.status(200).json({ user });
      } catch (error: any) {
         res.status(error.status ?? 500).json({ message: error.message });
      }
   },

   signup: async (req: Request, res: Response) => {
      try {
         const { name, email, password, confirmPassword } = req.body;
         const { token, user } = await authService.signup({
            name,
            email,
            password,
            confirmPassword,
         });
         res.cookie(TOKEN_COOKIE, token, {
            ...TOKEN_COOKIE_OPTIONS,
            maxAge: TOKEN_MAX_AGE_MS,
         });
         res.status(201).json({ user });
      } catch (error: any) {
         res.status(error.status ?? 500).json({ message: error.message });
      }
   },

   me: async (req: Request, res: Response) => {
      try {
         const token = req.cookies?.[TOKEN_COOKIE];
         if (!token) {
            return res.status(401).json({ message: "Token não fornecido" });
         }
         const user = await authService.me(token);
         res.status(200).json(user);
      } catch (error: any) {
         res.status(error.status ?? 500).json({ message: error.message });
      }
   },

   logout: async (_req: Request, res: Response) => {
      res.clearCookie(TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS);
      res.status(200).json({ message: "Logout realizado com sucesso" });
   },
};

export default authController;
