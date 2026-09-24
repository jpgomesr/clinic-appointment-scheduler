import pino from "pino";

const options =
   process.env.NODE_ENV === "production"
      ? { level: process.env.LOG_LEVEL ?? "info" }
      : {
           level: process.env.LOG_LEVEL ?? "info",
           transport: { target: "pino-pretty" },
        };

export const logger = pino(options);
