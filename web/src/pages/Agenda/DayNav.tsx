import { formatDayHeader } from "./date-utils";

type Props = {
   day: Date;
   onChange: (day: Date) => void;
};

export function DayNav({ day, onChange }: Props) {
   function shift(deltaDays: number) {
      onChange(new Date(day.getFullYear(), day.getMonth(), day.getDate() + deltaDays));
   }

   function goToToday() {
      const now = new Date();
      onChange(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
   }

   return (
      <div className="day-nav">
         <button type="button" onClick={() => shift(-1)} aria-label="Dia anterior">
            ‹
         </button>
         <button type="button" onClick={goToToday}>
            Hoje
         </button>
         <button type="button" onClick={() => shift(1)} aria-label="Próximo dia">
            ›
         </button>
         <h2 className="day-nav-label">{formatDayHeader(day)}</h2>
      </div>
   );
}
