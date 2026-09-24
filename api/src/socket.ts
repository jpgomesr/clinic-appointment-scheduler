import "dotenv/config";
import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import { parseCookie } from "cookie";
import { TOKEN_COOKIE } from "./auth/auth.constants";
import {
   ClientToServerEvents,
   ServerToClientEvents,
   SocketData,
} from "./socket.events";

export function setupSocket(httpServer: HttpServer) {
   const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((origin) =>
      origin.trim(),
   );

   const io = new Server<
      ClientToServerEvents,
      ServerToClientEvents,
      Record<string, never>,
      SocketData
   >(httpServer, {
      cors: { origin: corsOrigins, credentials: true },
   });

   io.use((socket, next) => {
      const rawCookies = socket.handshake.headers.cookie;
      const token = rawCookies
         ? parseCookie(rawCookies)[TOKEN_COOKIE]
         : undefined;
      if (!token) return next(new Error("Authentication error"));

      jwt.verify(
         token,
         process.env.JWT_SECRET!,
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
      console.log("User connected: ", socket.data.user);
   });

   return io;
}
