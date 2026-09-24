import type { Appointment } from "../../types/appointment";
import { AppointmentCard } from "./AppointmentCard";

type Props = {
   hour: number;
   appointments: Appointment[];
   professionalNameById: Map<string, string>;
   onEdit: (appointment: Appointment) => void;
   onCancel: (appointment: Appointment) => void;
};

export function HourColumn({ hour, appointments, professionalNameById, onEdit, onCancel }: Props) {
   const label = `${String(hour).padStart(2, "0")}:00`;

   return (
      <section className="hour-column">
         <header className="hour-column-header">
            <h3>{label}</h3>
         </header>

         <ul className="appointment-list">
            {appointments.map((appointment) => (
               <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  professionalName={professionalNameById.get(appointment.professionalId) ?? ""}
                  onEdit={() => onEdit(appointment)}
                  onCancel={() => onCancel(appointment)}
               />
            ))}
         </ul>
      </section>
   );
}
