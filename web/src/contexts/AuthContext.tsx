import { useEffect, useState, type ReactNode } from "react";
import { api } from "../services/api";
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
      const { user } = await api.post<{ user: User }>("/auth/login", input);
      setUser(user);
   };

   const signup = async (input: SignupInput) => {
      const { user } = await api.post<{ user: User }>("/auth/signup", input);
      setUser(user);
   };

   const logout = async () => {
      await api.post("/auth/logout");
      setUser(null);
   };

   return (
      <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
         {children}
      </AuthContext.Provider>
   );
}
