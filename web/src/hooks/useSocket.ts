import { useContext } from "react";
import { SocketContext } from "../contexts/socket-context";

export function useSocket() {
   const context = useContext(SocketContext);
   if (!context) {
      throw new Error("useSocket deve ser usado dentro de SocketProvider");
   }
   return context;
}
