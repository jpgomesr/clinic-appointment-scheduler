import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";

export function Home() {
   const { user, logout } = useAuth();

   const socket = useSocket();
   useEffect(() => {
      if (!socket) return;

      socket.on("connect", () => {
         console.log("Conectado ao servidor de WebSocket");
      });

      socket.on("disconnect", () => {
         console.log("Desconectado do servidor de WebSocket");
      });

      return () => {
         socket.off("connect");
         socket.off("disconnect");
      };
   }, [socket]);

   return (
      <section>
         <h1>Olá, {user?.name}</h1>
         <p>{user?.email}</p>
         <button type="button" onClick={() => logout()}>
            Sair
         </button>
      </section>
   );
}
