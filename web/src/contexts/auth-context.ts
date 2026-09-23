import { createContext } from "react";

export type User = {
   id: string;
   name: string;
   email: string;
};

export type LoginInput = { email: string; password: string };
export type SignupInput = {
   name: string;
   email: string;
   password: string;
   confirmPassword: string;
};

export type AuthContextValue = {
   user: User | null;
   loading: boolean;
   login: (input: LoginInput) => Promise<void>;
   signup: (input: SignupInput) => Promise<void>;
   logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
