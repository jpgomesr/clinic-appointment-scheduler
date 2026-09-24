import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, api } from "../../services/api";
import type { Appointment, Professional } from "../../types/appointment";
import {
   combineDateAndTime,
   fromDateInputValue,
   toDateInputValue,
   toTimeInputValue,
} from "./date-utils";

type Props = {
   professionals: Professional[];
   defaultProfessionalId?: string;
   defaultStart?: string;
   defaultEnd?: string;
   day: Date;
   appointment?: Appointment;
   onClose: () => void;
   onSaved: (appointment: Appointment) => void;
   onNotFound: (id: string) => void;
};

export function AppointmentFormDialog({
   professionals,
   defaultProfessionalId,
   defaultStart,
   defaultEnd,
   day,
   appointment,
   onClose,
   onSaved,
   onNotFound,
}: Props) {
   const dialogRef = useRef<HTMLDialogElement>(null);
   const isEditing = Boolean(appointment);

   const [professionalId, setProfessionalId] = useState(
      appointment?.professionalId ?? defaultProfessionalId ?? "",
   );
   const [date, setDate] = useState(
      toDateInputValue(appointment ? new Date(appointment.startAt) : day),
   );
   const [startTime, setStartTime] = useState(
      appointment ? toTimeInputValue(appointment.startAt) : defaultStart ?? "09:00",
   );
   const [endTime, setEndTime] = useState(
      appointment ? toTimeInputValue(appointment.endAt) : defaultEnd ?? "09:30",
   );
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      dialogRef.current?.showModal();
   }, []);

   useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const handleNativeClose = () => onClose();
      dialog.addEventListener("close", handleNativeClose);
      return () => dialog.removeEventListener("close", handleNativeClose);
   }, [onClose]);

   async function handleSubmit(event: FormEvent) {
      event.preventDefault();
      setError(null);

      const baseDay = fromDateInputValue(date);
      const startAt = combineDateAndTime(baseDay, startTime);
      const endAt = combineDateAndTime(baseDay, endTime);

      if (endAt <= startAt) {
         setError("O horário de término deve ser depois do início.");
         return;
      }

      setSubmitting(true);
      try {
         const body = {
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            professionalId,
         };

         const response =
            isEditing && appointment
               ? await api.put<{ appointment: Appointment }>(
                    `/appointments/${appointment.id}`,
                    body,
                 )
               : await api.post<{ appointment: Appointment }>("/appointments", body);

         onSaved(response.appointment);
      } catch (err) {
         if (err instanceof ApiError && err.status === 404 && appointment) {
            onNotFound(appointment.id);
            return;
         }
         setError(err instanceof ApiError ? err.message : "Erro inesperado");
      } finally {
         setSubmitting(false);
      }
   }

   return (
      <dialog ref={dialogRef} className="appointment-dialog">
         <form onSubmit={handleSubmit}>
            <h2>{isEditing ? "Editar agendamento" : "Novo agendamento"}</h2>

            <label htmlFor="appointment-professional">Profissional</label>
            <select
               id="appointment-professional"
               value={professionalId}
               onChange={(event) => setProfessionalId(event.target.value)}
               required
            >
               <option value="" disabled>
                  Selecione um profissional
               </option>
               {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                     {professional.name}
                  </option>
               ))}
            </select>

            <label htmlFor="appointment-date">Data</label>
            <input
               id="appointment-date"
               type="date"
               value={date}
               onChange={(event) => setDate(event.target.value)}
               required
            />

            <div className="appointment-dialog-times">
               <div>
                  <label htmlFor="appointment-start">Início</label>
                  <input
                     id="appointment-start"
                     type="time"
                     value={startTime}
                     onChange={(event) => setStartTime(event.target.value)}
                     required
                  />
               </div>
               <div>
                  <label htmlFor="appointment-end">Término</label>
                  <input
                     id="appointment-end"
                     type="time"
                     value={endTime}
                     onChange={(event) => setEndTime(event.target.value)}
                     required
                  />
               </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <div className="appointment-dialog-actions">
               <button type="button" onClick={() => dialogRef.current?.close()}>
                  Cancelar
               </button>
               <button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar"}
               </button>
            </div>
         </form>
      </dialog>
   );
}
