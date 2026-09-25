import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { users } from "../../db/schema";
import { SignupDto } from "../dto/signup.dto";
import { LoginDto } from "../dto/login.dto";

const authRepository = {
   getById: async (userId: string) => {
      return await db.query.users.findFirst({
         where: and(eq(users.id, userId), isNull(users.deletedAt)),
         columns: {
            id: true,
            name: true,
            email: true,
         },
      });
   },

   create: async (userSignupDto: SignupDto, passwordHash: string) => {
      return await db
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
   },

   exist: async (userDto: SignupDto | LoginDto) => {
      return await db.query.users.findFirst({
         // lower() cobre contas criadas antes de o e-mail ser normalizado no DTO
         where: and(
            eq(sql`lower(${users.email})`, userDto.email),
            isNull(users.deletedAt),
         ),
      });
   },
};

export default authRepository;
