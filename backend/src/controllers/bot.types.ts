export enum BotState {
  INICIO = "INICIO",
  SELECT_BARBER = "SELECT_BARBER",
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
    barberId?: string;
    servicioId?: string;
    horarioId?: string;
    nombres?: string;
    apellidos?: string;
    precioCita?: number;
    barberoNombre?: string;
    servicioNombre?: string;
    fechaHorario?: string;
    horaInicio?: string;
    listaServiciosMapping?: string[]; // Mapea opciones "1", "2" a UUIDs
    listaHorariosMapping?: string[]; // Mapea opciones "1", "2" a UUIDs
    barberListMapping?: any[]; // Mapea opciones "1", "2" a UUIDs
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
