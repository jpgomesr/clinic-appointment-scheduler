import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { ApiError, api } from "../../services/api";
import type {
   Appointment,
   AppointmentCancelledPayload,
   Professional,
} from "../../types/appointment";
import { AppointmentFormDialog } from "./AppointmentFormDialog";
import { CancelConfirmDialog } from "./CancelConfirmDialog";
import { DayNav } from "./DayNav";
import { HourColumn } from "./HourColumn";
import { ProfessionalFilter } from "./ProfessionalFilter";
import { isWithinLocalDay } from "./date-utils";
import { useDayAppointments } from "./useDayAppointments";
import "./Agenda.css";

function startOfToday(): Date {
   const now = new Date();
   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function buildHourColumns(appointments: Appointment[]): number[] {
   const hours = new Set(appointments.map((appointment) => new Date(appointment.startAt).getHours()));
   return Array.from(hours).sort((a, b) => a - b);
}

type DialogState =
   | { kind: "closed" }
   | { kind: "create" }
   | { kind: "edit"; appointment: Appointment }
   | { kind: "cancel"; appointment: Appointment };

export function Agenda() {
   const { user, logout } = useAuth();
   const socket = useSocket();

   const [day, setDay] = useState<Date>(startOfToday);
   const [professionals, setProfessionals] = useState<Professional[]>([]);
   const [professionalsError, setProfessionalsError] = useState<string | null>(null);
   const [selectedProfessionalId, setSelectedProfessionalId] = useState("all");
   const [dialogState, setDialogState] = useState<DialogState>({ kind: "closed" });
   const [notice, setNotice] = useState<string | null>(null);

   const { appointments, loading, error, upsert, remove } = useDayAppointments(day);

   useEffect(() => {
      let cancelled = false;
      api
         .get<{ professionals: Professional[] }>("/professionals")
         .then((response) => {
            if (!cancelled) setProfessionals(response.professionals);
         })
         .catch((err) => {
            if (!cancelled) {
               setProfessionalsError(err instanceof ApiError ? err.message : "Erro inesperado");
            }
         });
      return () => {
         cancelled = true;
      };
   }, []);

   const dayRef = useRef(day);
   useEffect(() => {
      dayRef.current = day;
   }, [day]);

   useEffect(() => {
      if (!socket) return;

      const onCreated = (payload: Appointment) => {
         if (isWithinLocalDay(payload.startAt, dayRef.current)) upsert(payload);
      };
      const onUpdated = (payload: Appointment) => {
         if (isWithinLocalDay(payload.startAt, dayRef.current)) upsert(payload);
         else remove(payload.id);
      };
      const onCancelled = (payload: AppointmentCancelledPayload) => remove(payload.id);

      socket.on("appointment:created", onCreated);
      socket.on("appointment:updated", onUpdated);
      socket.on("appointment:cancelled", onCancelled);

      return () => {
         socket.off("appointment:created", onCreated);
         socket.off("appointment:updated", onUpdated);
         socket.off("appointment:cancelled", onCancelled);
      };
   }, [socket, upsert, remove]);

   useEffect(() => {
      if (!notice) return;
      const timeout = setTimeout(() => setNotice(null), 5000);
      return () => clearTimeout(timeout);
   }, [notice]);

   const professionalNameById = useMemo(() => {
      const map = new Map<string, string>();
      for (const professional of professionals) map.set(professional.id, professional.name);
      return map;
   }, [professionals]);

   const filteredAppointments =
      selectedProfessionalId === "all"
         ? appointments
         : appointments.filter((appointment) => appointment.professionalId === selectedProfessionalId);

   const hourColumns = useMemo(() => buildHourColumns(filteredAppointments), [filteredAppointments]);

   const appointmentsByHour = useMemo(() => {
      const map = new Map<number, Appointment[]>();
      for (const appointment of filteredAppointments) {
         const hour = new Date(appointment.startAt).getHours();
         const list = map.get(hour) ?? [];
         list.push(appointment);
         map.set(hour, list);
      }
      for (const list of map.values()) {
         list.sort((a, b) => a.startAt.localeCompare(b.startAt));
      }
      return map;
   }, [filteredAppointments]);

   function handleNotFound(id: string) {
      remove(id);
      setDialogState({ kind: "closed" });
      setNotice("Agendamento não encontrado — pode ter sido alterado por outra pessoa.");
   }

   async function handleLogout() {
      try {
         await logout();
      } catch (err) {
         setNotice(err instanceof ApiError ? err.message : "Não foi possível sair. Tente novamente.");
      }
   }

   return (
      <section className="agenda">
         <header className="agenda-header">
            <div className="agenda-user">
               <span>Olá, {user?.name}</span>
               <button type="button" onClick={() => handleLogout()}>
                  Sair
               </button>
            </div>

            <div className="agenda-controls">
               <DayNav day={day} onChange={setDay} />
               <ProfessionalFilter
                  professionals={professionals}
                  value={selectedProfessionalId}
                  onChange={setSelectedProfessionalId}
               />
               <button
                  type="button"
                  className="agenda-create-button"
                  onClick={() => setDialogState({ kind: "create" })}
               >
                  + Novo agendamento
               </button>
            </div>
         </header>

         {notice && <p className="agenda-notice">{notice}</p>}
         {professionalsError && <p className="auth-error">{professionalsError}</p>}
         {error && <p className="auth-error">{error}</p>}
         {loading && <p className="agenda-loading">Carregando agenda...</p>}

         {hourColumns.length === 0 ? (
            <p className="agenda-empty">Nenhum agendamento neste dia.</p>
         ) : (
            <div className="agenda-board">
               {hourColumns.map((hour) => (
                  <HourColumn
                     key={hour}
                     hour={hour}
                     appointments={appointmentsByHour.get(hour) ?? []}
                     professionalNameById={professionalNameById}
                     onEdit={(appointment) => setDialogState({ kind: "edit", appointment })}
                     onCancel={(appointment) => setDialogState({ kind: "cancel", appointment })}
                  />
               ))}
            </div>
         )}

         {dialogState.kind === "create" && (
            <AppointmentFormDialog
               professionals={professionals}
               defaultProfessionalId={
                  selectedProfessionalId === "all" ? undefined : selectedProfessionalId
               }
               day={day}
               onClose={() => setDialogState({ kind: "closed" })}
               onSaved={(appointment) => {
                  if (isWithinLocalDay(appointment.startAt, day)) upsert(appointment);
                  setDialogState({ kind: "closed" });
               }}
               onNotFound={handleNotFound}
            />
         )}

         {dialogState.kind === "edit" && (
            <AppointmentFormDialog
               professionals={professionals}
               day={day}
               appointment={dialogState.appointment}
               onClose={() => setDialogState({ kind: "closed" })}
               onSaved={(appointment) => {
                  if (isWithinLocalDay(appointment.startAt, day)) upsert(appointment);
                  else remove(appointment.id);
                  setDialogState({ kind: "closed" });
               }}
               onNotFound={handleNotFound}
            />
         )}

         {dialogState.kind === "cancel" && (
            <CancelConfirmDialog
               appointment={dialogState.appointment}
               professionalName={professionalNameById.get(dialogState.appointment.professionalId) ?? ""}
               onClose={() => setDialogState({ kind: "closed" })}
               onCancelled={(id) => {
                  remove(id);
                  setDialogState({ kind: "closed" });
               }}
               onNotFound={handleNotFound}
            />
         )}
      </section>
   );
}
