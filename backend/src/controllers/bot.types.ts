export enum BotState {
  INICIO = "INICIO",
  SELECT_BARBER = "SELECT_BARBER",
  SELECT_PROCEDURE = "SELECT_PROCEDURE",
  SELECT_DATE = "SELECT_DATE",
  SELECT_TIME_SLOT = "SELECT_TIME_SLOT",
  DATA_CONFIRMATION = "DATA_CONFIRMATION",
  // CU-05: Cancelar / reprogramar
  LIST_CITAS = "LIST_CITAS",
  CANCEL_CONFIRM = "CANCEL_CONFIRM",
  RESCHEDULE_DATE = "RESCHEDULE_DATE",
  RESCHEDULE_TIME = "RESCHEDULE_TIME",
}

export interface UserSession {
  telefono: string;
  estadoActual: BotState;
  datosTemporales: {
    servicioId?: string;
    horarioId?: string;
    nombres?: string;
    apellidos?: string;
    precioCita?: number;
    servicioNombre?: string;
    barberoNombre?: string;
    fechaHorario?: string;
    horaInicio?: string;
    listaServiciosMapping?: string[];
    listaHorariosMapping?: string[];
    //
    user?: any;
    barberListMapping?: any[];
    barber?: {
      id?: string;
      name?: string;
    };
    proceduresList?: any[];
    procedure?: any;
    procedureDates?: any[];
    selectedDate?: any;
    timeSlotsList?: any[];
    selectedTimeSlot?: any;
    // CU-05: Cancelar / reprogramar
    citasActivas?: any[];
    selectedCita?: any;
  };
}

export interface WebhookMessage {
  from: string;
  type: string;
  userName?: string;
  text?: { body: string };
  interactive?: {
    list_reply?: { id: string };
  };
}

export interface WebhookValue {
  messages?: WebhookMessage[];
}

export interface WebhookChange {
  value?: WebhookValue;
}

export interface WebhookEntry {
  changes?: WebhookChange[];
}

export enum timeSlotStatus {
  available = "disponible",
  busy = "ocupado",
}
