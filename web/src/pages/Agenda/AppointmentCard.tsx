import type { CSSProperties } from "react";
import type { Appointment } from "../../types/appointment";
import { formatTime } from "./date-utils";

type CardStyle = CSSProperties & { "--card-accent": string };

const CARD_ACCENTS = [
   "#aa3bff",
   "#3ba3ff",
   "#3bd18f",
   "#ffb23b",
   "#ff6b6b",
   "#8d6bff",
];

function accentFor(professionalId: string): string {
   let hash = 0;
   for (const char of professionalId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
   return CARD_ACCENTS[hash % CARD_ACCENTS.length];
}

type Props = {
   appointment: Appointment;
   professionalName: string;
   onEdit: () => void;
   onCancel: () => void;
};

export function AppointmentCard({ appointment, professionalName, onEdit, onCancel }: Props) {
   return (
      <li
         className="appointment-card"
         style={{ "--card-accent": accentFor(appointment.professionalId) } as CardStyle}
      >
         <div className="appointment-card-info">
            <span className="appointment-card-professional">{professionalName}</span>
            <span className="appointment-card-time">
               {formatTime(appointment.startAt)} – {formatTime(appointment.endAt)}
            </span>
         </div>
         <div className="appointment-card-actions">
            <button type="button" className="appointment-card-edit" onClick={onEdit}>
               Editar
            </button>
            <button type="button" className="appointment-card-cancel" onClick={onCancel}>
               Cancelar
            </button>
         </div>
      </li>
   );
}
