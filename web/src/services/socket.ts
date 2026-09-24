import { io, Socket } from "socket.io-client";
import { API_URL } from "../config/env";

export const socket: Socket = io(API_URL, {
   withCredentials: true,
   autoConnect: false,
});
