import pino from "pino";

const base = {
   level: process.env.LOG_LEVEL ?? "info",
   // o pino-http registra os headers de cada request; o Bearer não pode ir para o log
   redact: ["req.headers.authorization"],
};

const options =
   process.env.NODE_ENV === "production"
      ? base
      : { ...base, transport: { target: "pino-pretty" } };

export const logger = pino(options);
