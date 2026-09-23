import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL as string;

export const socket: Socket = io(API_URL, {
   withCredentials: true,
   autoConnect: false,
});
