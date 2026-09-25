import { useEffect, useState, type ReactNode } from "react";
import { api } from "../services/api";
import { setToken, clearToken } from "../services/token";
import {
   AuthContext,
   type LoginInput,
   type SignupInput,
   type User,
} from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      api
         .get<User>("/auth/me")
         .then(setUser)
         .catch(() => setUser(null))
         .finally(() => setLoading(false));
   }, []);

   const login = async (input: LoginInput) => {
      const { user, token } = await api.post<{ user: User; token: string }>(
         "/auth/login",
         input,
      );
      setToken(token);
      setUser(user);
   };

   const signup = async (input: SignupInput) => {
      const { user, token } = await api.post<{ user: User; token: string }>(
         "/auth/signup",
         input,
      );
      setToken(token);
      setUser(user);
   };

   const logout = async () => {
      try {
         await api.post("/auth/logout");
      } finally {
         clearToken();
         setUser(null);
      }
   };

   return (
      <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
         {children}
      </AuthContext.Provider>
   );
}
