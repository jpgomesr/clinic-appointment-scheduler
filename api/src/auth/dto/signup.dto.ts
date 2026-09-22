import { z } from "zod";

export const loginSchema = z.object({
   name: z.string().min(1).max(255),
   email: z.string().email(),
   password: z.string().min(6).max(255),
   confirmPassword: z.string().min(6).max(255),
});

export type SignupDto = z.infer<typeof loginSchema>;
