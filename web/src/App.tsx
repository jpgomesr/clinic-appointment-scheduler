import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
   return (
      <AuthProvider>
         <SocketProvider>
            <AppRoutes />
         </SocketProvider>
      </AuthProvider>
   );
}

export default App;
