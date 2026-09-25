import { useEffect, type ReactNode } from "react";
import { socket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";
import { SocketContext } from "./socket-context";

export function SocketProvider({ children }: { children: ReactNode }) {
   const { user, logout } = useAuth();

   useEffect(() => {
      if (!user) return;

      // mesma mensagem emitida pelo middleware de handshake em api/src/socket.ts
      const onConnectError = (err: Error) => {
         if (err.message === "Authentication error") logout().catch(() => {});
      };

      socket.on("connect_error", onConnectError);
      socket.connect();
      return () => {
         socket.off("connect_error", onConnectError);
         socket.disconnect();
      };
   }, [user, logout]);

   return (
      <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
   );
}
