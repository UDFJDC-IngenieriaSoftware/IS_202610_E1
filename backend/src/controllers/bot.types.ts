export enum BotState {
  INICIO = "INICIO",
  SELECT_BARBER = "SELECT_BARBER",
  SELECT_PROCEDURE = "SELECT_PROCEDURE",
  SELECT_DATE = "SELECT_DATE",
  SELECT_TIME_SLOT = "SELECT_TIME_SLOT",
  DATA_CONFIRMATION = "DATA_CONFIRMATION",
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
