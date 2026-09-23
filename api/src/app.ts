import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./auth/auth.routes";
import appointmentsRouter from "./appointments/appointments.routes";
import { authToken } from "./auth/auth.middleware";

const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((origin) =>
   origin.trim(),
);

const app = express();
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/appointments", authToken, appointmentsRouter);

export default app;
