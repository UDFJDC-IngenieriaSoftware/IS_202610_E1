export enum BotState {
  INICIO = "INICIO",
  SELECT_BARBER = "SELECT_BARBER",
  SELECT_PROCEDURE = "SELECT_PROCEDURE",
  SELECT_TIME_SLOT = "SELECT_TIME_SLOT",
  AGENDANDO_SELECCIONANDO_SERVICIO = "AGENDANDO_SELECCIONANDO_SERVICIO",
  AGENDANDO_SELECCIONANDO_HORARIO = "AGENDANDO_SELECCIONANDO_HORARIO",
  AGENDANDO_INGRESANDO_NOMBRE = "AGENDANDO_INGRESANDO_NOMBRE",
  AGENDANDO_INGRESANDO_APELLIDO = "AGENDANDO_INGRESANDO_APELLIDO",
  AGENDANDO_CONFIRMANDO = "AGENDANDO_CONFIRMANDO",
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
    fechaHorario?: string;
    horaInicio?: string;
    listaServiciosMapping?: string[];
    listaHorariosMapping?: string[];
    barberListMapping?: any[];
    barber?: {
      id?: string;
      name?: string;
    };
    proceduresList?: any[];
    procedure?: any;
    timeSlotsList?: any[];
  };
}

export interface WebhookMessage {
  from: string;
  type: string;
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
