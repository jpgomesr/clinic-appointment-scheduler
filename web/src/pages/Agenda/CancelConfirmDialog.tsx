import { useEffect, useRef, useState } from "react";
import { ApiError, api } from "../../services/api";
import type { Appointment } from "../../types/appointment";
import { formatTime } from "./date-utils";

type Props = {
   appointment: Appointment;
   professionalName: string;
   onClose: () => void;
   onCancelled: (id: string) => void;
   onNotFound: (id: string) => void;
};

export function CancelConfirmDialog({
   appointment,
   professionalName,
   onClose,
   onCancelled,
   onNotFound,
}: Props) {
   const dialogRef = useRef<HTMLDialogElement>(null);
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      if (dialogRef.current && !dialogRef.current.open) {
         dialogRef.current.showModal();
      }
   }, []);

   useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const handleNativeClose = () => onClose();
      dialog.addEventListener("close", handleNativeClose);
      return () => dialog.removeEventListener("close", handleNativeClose);
   }, [onClose]);

   async function handleConfirm() {
      setError(null);
      setSubmitting(true);
      try {
         await api.delete(`/appointments/${appointment.id}`);
         onCancelled(appointment.id);
      } catch (err) {
         if (err instanceof ApiError && err.status === 404) {
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
         <h2>Cancelar agendamento?</h2>
         <p>
            {professionalName} · {formatTime(appointment.startAt)} – {formatTime(appointment.endAt)}
         </p>

         {error && <p className="auth-error">{error}</p>}

         <div className="appointment-dialog-actions">
            <button type="button" onClick={() => dialogRef.current?.close()}>
               Voltar
            </button>
            <button type="button" onClick={handleConfirm} disabled={submitting}>
               {submitting ? "Cancelando..." : "Confirmar cancelamento"}
            </button>
         </div>
      </dialog>
   );
}
