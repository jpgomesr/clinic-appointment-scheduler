import express from "express";
import { env } from "./config/env";
import cors from "cors";
import authRouter from "./auth/routes/auth.routes";
import appointmentsRouter from "./appointments/routes/appointments.routes";
import professionalsRouter from "./professionals/routes/professionals.routes";
import { authToken } from "./auth/middleware/auth.middleware";
import { errorHandler } from "./shared/middleware/error-handler";
import { AppError } from "./shared/errors/app-error";
import { pinoHttp } from "pino-http";
import { logger } from "./shared/logger/logger";

const app = express();
app.use(pinoHttp({ logger }));
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use("/auth", authRouter);
app.use("/appointments", authToken, appointmentsRouter);
app.use("/professionals", authToken, professionalsRouter);

app.use((req, res, next) => next(AppError.notFound("Rota não encontrada")));
app.use(errorHandler);

export default app;
