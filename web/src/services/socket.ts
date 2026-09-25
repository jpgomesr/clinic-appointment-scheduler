import { io, Socket } from "socket.io-client";
import { API_URL } from "../config/env";
import { getToken } from "./token";

export const socket: Socket = io(API_URL, {
   autoConnect: false,
   auth: (cb) => cb({ token: getToken() }),
});
