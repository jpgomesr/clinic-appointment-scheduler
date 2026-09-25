import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { LoginDto } from "../dto/login.dto";
import { SignupDto } from "../dto/signup.dto";
import authRepository from "../repository/auth.repository";
import { AppError } from "../../shared/errors/app-error";
import { env } from "../../config/env";

const authService = {
   login: async (userLoginDto: LoginDto) => {
      const user = await authRepository.exist(userLoginDto);

      const invalid = AppError.unauthorized("Credenciais inválidas");
      if (!user) throw invalid;

      const match = await bcrypt.compare(userLoginDto.password, user.password);
      if (!match) throw invalid;

      const token = jwt.sign(
         { id: user.id, email: user.email },
         env.JWT_SECRET,
         { expiresIn: "8h" },
      );

      return {
         token,
         user: { id: user.id, name: user.name, email: user.email },
      };
   },

   signup: async (userSignupDto: SignupDto) => {
      const signupEnabled = env.SIGNUP_ENABLED;
      if (!signupEnabled) throw AppError.unauthorized("Signup desativado");

      const existingUser = await authRepository.exist(userSignupDto);
      if (existingUser) {
         throw AppError.conflict("Email já cadastrado");
      }

      const passwordHash = await bcrypt.hash(userSignupDto.password, 10);

      const [user] = await authRepository.create(userSignupDto, passwordHash);

      if (!user) {
         throw new Error("Falha ao criar usuário");
      }

      const token = jwt.sign(
         { id: user.id, email: user.email },
         env.JWT_SECRET,
         { expiresIn: "8h" },
      );

      return {
         token,
         user: { id: user.id, name: user.name, email: user.email },
      };
   },

   me: async (jwtRaw: string) => {
      const payload = jwt.verify(jwtRaw, env.JWT_SECRET) as JwtPayload;
      const userId = payload.id as string;
      const user = await authRepository.getById(userId);
      if (!user) {
         throw AppError.notFound("Usuário não encontrado");
      }
      return user;
   },
};

export default authService;
