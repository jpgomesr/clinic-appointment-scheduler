const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
   status: number;

   constructor(status: number, message: string) {
      super(message);
      this.status = status;
   }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
   const res = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
   });

   const data = await res.json().catch(() => null);

   if (!res.ok) {
      throw new ApiError(res.status, data?.message ?? "Erro inesperado");
   }

   return data as T;
}

export const api = {
   get: <T>(path: string) => request<T>(path),
   post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
