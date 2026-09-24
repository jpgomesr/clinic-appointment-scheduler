export type Appointment = {
   id: string;
   startAt: string;
   endAt: string;
   professionalId: string;
};

export type Professional = {
   id: string;
   name: string;
};

export type AppointmentCancelledPayload = { id: string };
