import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ApiError, api } from "../../services/api";
import type { Appointment } from "../../types/appointment";
import { localDayBounds } from "./date-utils";

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

   const [reloadKey, setReloadKey] = useState(0);
   const loadingRef = useRef(false);
   const pendingRef = useRef<Action[]>([]);

   useEffect(() => {
      const controller = new AbortController();
      loadingRef.current = true;
      pendingRef.current = [];
      dispatch({ type: "loading" });

      async function load() {
         try {
            const [start, end] = localDayBounds(day);
            const response = await api.get<{ appointments: Appointment[] }>(
               `/appointments?from=${start.toISOString()}&to=${end.toISOString()}`,
               { signal: controller.signal },
            );
            dispatch({ type: "loaded", items: response.appointments });
            for (const action of pendingRef.current) dispatch(action);
         } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            dispatch({
               type: "error",
               message: err instanceof ApiError ? err.message : "Erro ao carregar a agenda",
            });
         } finally {
            loadingRef.current = false;
            pendingRef.current = [];
         }
      }

      load();
      return () => controller.abort();
   }, [day, reloadKey]);

   const reload = useCallback(() => setReloadKey((key) => key + 1), []);

   const upsert = useCallback((item: Appointment) => {
      const action: Action = { type: "upsert", item };
      if (loadingRef.current) pendingRef.current.push(action);
      dispatch(action);
   }, []);
   const remove = useCallback((id: string) => {
      const action: Action = { type: "remove", id };
      if (loadingRef.current) pendingRef.current.push(action);
      dispatch(action);
   }, []);

   const appointments = Object.values(state.byId).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
   );

   return { appointments, loading: state.loading, error: state.error, upsert, remove, reload };
}
