import { JwtPayload } from "jsonwebtoken";
import { Server } from "socket.io";
import {
   ClientToServerEvents,
   ServerToClientEvents,
   SocketData,
} from "../socket.events";

declare global {
   namespace Express {
      interface Locals {
         io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            Record<string, never>,
            SocketData
         >;
      }
      interface Request {
        user: JwtPayload
      }
   }
}
