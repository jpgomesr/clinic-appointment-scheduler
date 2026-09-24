import { useCallback, useEffect, useReducer } from "react";
import { ApiError, api } from "../../services/api";
import type { Appointment } from "../../types/appointment";
import { isWithinLocalDay, utcDateStringsForLocalDay } from "./date-utils";

type State = {
   byId: Record<string, Appointment>;
   loading: boolean;
   error: string | null;
};

type Action =
   | { type: "loading" }
   | { type: "loaded"; items: Appointment[] }
   | { type: "error"; message: string }
   | { type: "upsert"; item: Appointment }
   | { type: "remove"; id: string };

function reducer(state: State, action: Action): State {
   switch (action.type) {
      case "loading":
         return { ...state, loading: true, error: null };
      case "loaded": {
         const byId: Record<string, Appointment> = {};
         for (const item of action.items) byId[item.id] = item;
         return { byId, loading: false, error: null };
      }
      case "error":
         return { ...state, loading: false, error: action.message };
      case "upsert":
         return { ...state, byId: { ...state.byId, [action.item.id]: action.item } };
      case "remove": {
         if (!(action.id in state.byId)) return state;
         const byId = { ...state.byId };
         delete byId[action.id];
         return { ...state, byId };
      }
   }
}

export function useDayAppointments(day: Date) {
   const [state, dispatch] = useReducer(reducer, {
      byId: {},
      loading: true,
      error: null,
   });

   useEffect(() => {
      const controller = new AbortController();
      dispatch({ type: "loading" });

      async function load() {
         try {
            const dates = utcDateStringsForLocalDay(day);
            const responses = await Promise.all(
               dates.map((date) =>
                  api.get<{ appointments: Appointment[] }>(`/appointments?date=${date}`, {
                     signal: controller.signal,
                  }),
               ),
            );
            const items = responses
               .flatMap((response) => response.appointments)
               .filter((appointment) => isWithinLocalDay(appointment.startAt, day));
            dispatch({ type: "loaded", items });
         } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            dispatch({
               type: "error",
               message: err instanceof ApiError ? err.message : "Erro ao carregar a agenda",
            });
         }
      }

      load();
      return () => controller.abort();
   }, [day]);

   const upsert = useCallback((item: Appointment) => dispatch({ type: "upsert", item }), []);
   const remove = useCallback((id: string) => dispatch({ type: "remove", id }), []);

   const appointments = Object.values(state.byId).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
   );

   return { appointments, loading: state.loading, error: state.error, upsert, remove };
}
