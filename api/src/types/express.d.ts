import { JwtPayload } from "jsonwebtoken";
import { Server } from "socket.io";

declare global {
   namespace Express {
      interface Locals {
         io: Server;
      }
      interface Request {
        user: JwtPayload
      }
   }
}
