import { z } from "zod";

export const signupType = z
   .object({
      name: z.string().min(1).max(255),
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(6).max(255),
      confirmPassword: z.string().min(6).max(255),
   })
   .refine((data) => data.password === data.confirmPassword, {
      message: "Senhas não conferem",
      path: ["confirmPassword"],
   });

export type SignupDto = z.infer<typeof signupType>;
