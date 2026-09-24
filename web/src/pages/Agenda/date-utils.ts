export function localDayBounds(day: Date): [Date, Date] {
   const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
   const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
   return [start, end];
}

function toUtcDateString(date: Date): string {
   return date.toISOString().slice(0, 10);
}

export function utcDateStringsForLocalDay(day: Date): string[] {
   const [start, end] = localDayBounds(day);
   const lastInstant = new Date(end.getTime() - 1);
   return Array.from(new Set([toUtcDateString(start), toUtcDateString(lastInstant)]));
}

export function isWithinLocalDay(iso: string, day: Date): boolean {
   const [start, end] = localDayBounds(day);
   const time = new Date(iso).getTime();
   return time >= start.getTime() && time < end.getTime();
}

export function toDateInputValue(day: Date): string {
   const year = day.getFullYear();
   const month = String(day.getMonth() + 1).padStart(2, "0");
   const date = String(day.getDate()).padStart(2, "0");
   return `${year}-${month}-${date}`;
}

export function fromDateInputValue(value: string): Date {
   const [year, month, date] = value.split("-").map(Number);
   return new Date(year, month - 1, date);
}

export function toTimeInputValue(iso: string): string {
   const date = new Date(iso);
   return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function combineDateAndTime(day: Date, time: string): Date {
   const [hour, minute] = time.split(":").map(Number);
   return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
}

const dayHeaderFormatter = new Intl.DateTimeFormat("pt-BR", {
   weekday: "long",
   day: "2-digit",
   month: "2-digit",
   year: "numeric",
});

export function formatDayHeader(day: Date): string {
   return dayHeaderFormatter.format(day);
}

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
   hour: "2-digit",
   minute: "2-digit",
});

export function formatTime(iso: string): string {
   return timeFormatter.format(new Date(iso));
}
