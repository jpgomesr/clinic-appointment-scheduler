import { useEffect, type ReactNode } from "react";
import { socket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";
import { SocketContext } from "./socket-context";

export function SocketProvider({ children }: { children: ReactNode }) {
   const { user } = useAuth();

   useEffect(() => {
      if (!user) return;

      socket.connect();
      return () => {
         socket.disconnect();
      };
   }, [user]);

   return (
      <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
   );
}
