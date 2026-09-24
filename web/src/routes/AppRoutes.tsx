import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { Login } from "../pages/Login/Login";
import { Signup } from "../pages/Signup/Signup";
import { Agenda } from "../pages/Agenda/Agenda";
import { PublicRoute } from "./PublicRoute";

export function AppRoutes() {
   return (
      <Routes>
         <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
         </Route>

         <Route element={<PrivateRoute />}>
            <Route path="/" element={<Agenda />} />
         </Route>

         <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
   );
}
