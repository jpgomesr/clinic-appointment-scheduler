import { Request, Response } from "express";
import authService from "../service/auth.service";
import { getBearerToken } from "../middleware/auth.middleware";
import { loginType } from "../dto/login.dto";
import { signupType } from "../dto/signup.dto";
import { AppError } from "../../shared/errors/app-error";

const authController = {
   login: async (req: Request, res: Response) => {
      const loginDto = loginType.parse(req.body);
      const { token, user } = await authService.login(loginDto);
      res.status(200).json({ user, token });
   },

   signup: async (req: Request, res: Response) => {
      const signupDto = signupType.parse(req.body);
      const { token, user } = await authService.signup(signupDto);
      res.status(201).json({ user, token });
   },

   me: async (req: Request, res: Response) => {
      const token = getBearerToken(req);
      if (!token) {
         throw AppError.unauthorized("Token não fornecido");
      }
      const user = await authService.me(token);
      res.status(200).json(user);
   },

   logout: async (_req: Request, res: Response) => {
      res.status(200).json({ message: "Logout realizado com sucesso" });
   },
};

export default authController;
