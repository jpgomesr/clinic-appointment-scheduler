import { db } from "../../db/client";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { LoginDto } from "../dto/login.dto";
import { SignupDto } from "../dto/signup.dto";

const authService = {
   login: async (userLoginDto: LoginDto) => {
      const user = await db.query.users.findFirst({
         where: eq(users.email, userLoginDto.email),
      });

      const invalid = Object.assign(new Error("Credenciais inválidas"), {
         status: 401,
      });
      if (!user) throw invalid;

      const match = await bcrypt.compare(userLoginDto.password, user.password);
      if (!match) throw invalid;

      const token = jwt.sign(
         { id: user.id, email: user.email },
         process.env.JWT_SECRET!,
         { expiresIn: "8h" },
      );

      return {
         token,
         user: { id: user.id, name: user.name, email: user.email },
      };
   },

   signup: async (userSignupDto: SignupDto) => {
      const existingUser = await db.query.users.findFirst({
         where: eq(users.email, userSignupDto.email),
      });
      if (existingUser) {
         throw Object.assign(new Error("Email já cadastrado"), { status: 409 });
      }

      if (userSignupDto.password !== userSignupDto.confirmPassword) {
         throw Object.assign(new Error("Senhas não conferem"), { status: 400 });
      }

      const passwordHash = await bcrypt.hash(userSignupDto.password, 10);

      const [user] = await db
         .insert(users)
         .values({
            name: userSignupDto.name,
            email: userSignupDto.email,
            password: passwordHash,
         })
         .returning({
            id: users.id,
            name: users.name,
            email: users.email,
         });

      if (!user) {
         throw Object.assign(new Error("Falha ao criar usuário"), {
            status: 500,
         });
      }

      const token = jwt.sign(
         { id: user.id, email: user.email },
         process.env.JWT_SECRET!,
         { expiresIn: "8h" },
      );

      return {
         token,
         user: { id: user.id, name: user.name, email: user.email },
      };
   },

   me: async (jwtRaw: string) => {
      const payload = jwt.verify(jwtRaw, process.env.JWT_SECRET!) as JwtPayload;
      const userId = payload.id as string;
      const user = await db.query.users.findFirst({
         where: eq(users.id, userId),
         columns: {
            id: true,
            name: true,
            email: true,
         },
      });
      if (!user) {
         throw Object.assign(new Error("Usuário não encontrado"), {
            status: 404,
         });
      }
      return user;
   },
};

export default authService;
