import { JwtPayload } from "jsonwebtoken";

export interface AppointmentEventPayload {
   id: string;
   startAt: Date;
   endAt: Date;
   professionalId: string;
}

export interface AppointmentCancelledPayload {
   id: string;
}

export interface ServerToClientEvents {
   "appointment:created": (payload: AppointmentEventPayload) => void;
   "appointment:updated": (payload: AppointmentEventPayload) => void;
   "appointment:cancelled": (payload: AppointmentCancelledPayload) => void;
}

export type ClientToServerEvents = Record<string, never>;

export interface SocketData {
   user: JwtPayload | string | undefined;
}
