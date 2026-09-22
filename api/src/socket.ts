import "dotenv/config";
import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import { parseCookie } from "cookie";
import { TOKEN_COOKIE } from "./auth/auth.constants";

export function setupSocket(httpServer: HttpServer) {
   const io = new Server(httpServer, {
      cors: { origin: process.env.CORS_ORIGIN, credentials: true },
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

      socket.on("join:clinic", (clinicId: string) => {
         socket.join(`clinic:${clinicId}`);
      });
   });

   return io;
}
