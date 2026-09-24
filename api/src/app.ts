import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./auth/routes/auth.routes";
import appointmentsRouter from "./appointments/routes/appointments.routes";
import professionalsRouter from "./professionals/routes/professionals.routes";
import { authToken } from "./auth/middleware/auth.middleware";
import { errorHandler } from "./shared/middleware/error-handler";
import { pinoHttp } from "pino-http";
import { logger } from "./shared/logger/logger";

const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((origin) =>
   origin.trim(),
);

const app = express();
app.use(pinoHttp({ logger }));
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/appointments", authToken, appointmentsRouter);
app.use("/professionals", authToken, professionalsRouter);

app.use((req, res) => res.status(404).json({ message: "Rota não encontrada" }));
app.use(errorHandler);

export default app;
