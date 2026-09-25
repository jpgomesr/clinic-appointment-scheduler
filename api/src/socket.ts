import { Server } from "socket.io";
import { env } from "./config/env";
import { Server as HttpServer } from "http";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import {
   ClientToServerEvents,
   ServerToClientEvents,
   SocketData,
} from "./socket.events";
import { logger } from "./shared/logger/logger";

export function setupSocket(httpServer: HttpServer) {
   const io = new Server<
      ClientToServerEvents,
      ServerToClientEvents,
      Record<string, never>,
      SocketData
   >(httpServer, {
      cors: { origin: env.CORS_ORIGIN },
   });

   io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error"));

      jwt.verify(
         token,
         env.JWT_SECRET,
         (
            err: VerifyErrors | null,
            decoded: JwtPayload | string | undefined,
         ) => {
            if (err) return next(new Error("Authentication error"));
            socket.data.user = decoded;
            next();
         },
      );
   });

   io.on("connection", (socket) => {
      logger.info({ user: socket.data.user }, "User connected");
   });

   return io;
}
