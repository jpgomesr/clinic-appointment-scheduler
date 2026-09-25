import { API_URL } from "../config/env";
import { getToken, clearToken } from "./token";

export class ApiError extends Error {
   status: number;

   constructor(status: number, message: string) {
      super(message);
      this.status = status;
   }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
   onUnauthorized = handler;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
   const token = getToken();
   const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
         "Content-Type": "application/json",
         ...(token ? { Authorization: `Bearer ${token}` } : {}),
         ...options.headers,
      },
   });

   const data = await res.json().catch(() => null);

   if (!res.ok) {
      if (res.status === 401) {
         clearToken();
         onUnauthorized?.();
      }
      throw new ApiError(res.status, data?.message ?? "Erro inesperado");
   }

   return data as T;
}

export const api = {
   get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
   post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body: JSON.stringify(body) }),
   put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
   delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
