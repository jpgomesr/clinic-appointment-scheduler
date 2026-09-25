import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
   JWT_SECRET: z.string().min(1),
   DATABASE_URL: z.string().min(1),
   // obrigatório: sem ele o cors() liberaria qualquer origem
   CORS_ORIGIN: z
      .string()
      .min(1)
      .transform((value) => value.split(",").map((origin) => origin.trim())),
   SIGNUP_ENABLED: z
      .string()
      .default("true")
      .transform((value) => value === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
   const missing = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
   throw new Error(`Variáveis de ambiente ausentes ou inválidas: ${missing}`);
}

export const env = parsed.data;
