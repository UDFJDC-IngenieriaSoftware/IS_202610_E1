import { BotState, UserSession } from "./bot.types";
import { Servicio } from "../models";
import { ProcedureService } from "../services/procedure.service";
import { BarberService } from "../services/barber.service";
import { AvailabilityService, fromMinutes } from "../services/availability.service";
import { BookingService } from "../services/booking.service";
import { PaymentService } from "../services/payment.service";
import logger from "../utils/logger";

const procedureService = new ProcedureService(new Servicio());
const barberService = new BarberService(procedureService);
const availabilityService = new AvailabilityService();
const bookingService = new BookingService();
const paymentService = new PaymentService();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toMinutes(value: string): number {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

const formatCOP = (value: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

const formatDate = (fecha: string): string => {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
};

const MENU_TEXT =
  `¿Qué deseas hacer?\n` +
  `*1.* ✂️ Agendar por barbero\n` +
  `*2.* ✂️ Agendar por servicio\n` +
  `*3.* 📋 Mis citas (cancelar / reprogramar)`;

const renderDatesList = (dates: { idx: number; fecha: string }[]): string => {
  let text = `📅 *Próximas fechas disponibles:*\n\n`;
  dates.forEach((d) => {
    text += `*${d.idx}.* ${formatDate(d.fecha)}\n`;
  });
  text += `\n👉 Responde con el número de la fecha.`;
  return text;
};

async function generateAvailableDates(
  idBarbero: string,
  duracion: number,
  maxDates = 6,
  lookAheadDays = 30,
): Promise<Array<{ idx: number; fecha: string }>> {
  const result: Array<{ idx: number; fecha: string }> = [];
  const today = new Date();
  for (let i = 1; i <= lookAheadDays && result.length < maxDates; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const fecha = d.toISOString().split("T")[0];
    try {
      const slots = await availabilityService.getAvailableSlots(idBarbero, fecha, duracion);
      if (slots.some((s) => s.available)) {
        result.push({ idx: result.length + 1, fecha });
      }
    } catch {
      // skip days that error
    }
  }
  return result;
}

// ─── STATE MACHINE ────────────────────────────────────────────────────────────

export const StateHandlers: Record<
  BotState,
  (session: UserSession, input: string) => Promise<string>
> = {
  [BotState.INICIO]: handleInicio,
  [BotState.SELECT_BARBER]: handlerSelectBarber,
  [BotState.SELECT_PROCEDURE]: handlerSelectProcedure,
  [BotState.SELECT_DATE]: handleSelectDate,
  [BotState.SELECT_TIME_SLOT]: handleSelectTimeSlot,
  [BotState.DATA_CONFIRMATION]: handleDataConfirmation,
  [BotState.LIST_CITAS]: handleListCitas,
  [BotState.CANCEL_CONFIRM]: handleCancelConfirm,
  [BotState.RESCHEDULE_DATE]: handleRescheduleDate,
  [BotState.RESCHEDULE_TIME]: handleRescheduleTime,
};

// ─── HANDLERS ────────────────────────────────────────────────────────────────

async function handleInicio(session: UserSession, input: string): Promise<string> {
  const nombre = session.datosTemporales.user?.nombres ?? "amigo";

  if (input === "1") {
    let barberos = await barberService.getAllBarbers();
    barberos = barberos.map((b, idx) => ({ ...b, idx: idx + 1 }));
    let text = `💈 *Nuestro equipo* 💈\n\n`;
    barberos.forEach((b) => {
      text += `*${b.idx}.* ${b.nombres} ${b.apellidos}\n`;
    });
    session.datosTemporales.barberListMapping = barberos;
    session.estadoActual = BotState.SELECT_BARBER;
    text += `\n👉 Responde con el número del barbero.`;
    return text.trim();
  }

  if (input === "2") {
    const procedures = (await procedureService.getServicesMenuText())
      .slice(0, 11)
      .map((p, idx) => ({ ...p, idx: idx + 1 }));

    if (!procedures.length) {
      return "😕 No hay servicios disponibles en este momento. Inténtalo de nuevo más tarde.";
    }

    session.datosTemporales.barberListMapping = procedures.map((p) => ({ ...p.barbero }));
    session.datosTemporales.proceduresList = [...procedures];

    let mensaje = `✂️ *Nuestros servicios* ✂️\n\n`;
    procedures.forEach((serv) => {
      const barberName = serv.barbero
        ? `${serv.barbero.nombres} ${serv.barbero.apellidos}`
        : "Barbero";
      mensaje += `*${serv.idx}.* ${serv.nombre} — _con ${barberName}_\n`;
      if (serv.descripcion) mensaje += `   📝 ${serv.descripcion}\n`;
      mensaje += `   💵 ${formatCOP(serv.precio)}  ·  ⏱️ ${serv.duracion} min\n\n`;
    });
    mensaje += `👉 Responde con el número del servicio.`;
    session.estadoActual = BotState.SELECT_PROCEDURE;
    return mensaje;
  }

  // CU-05: ver citas activas
  if (input === "3") {
    try {
      const citas = await bookingService.listForCliente(session.telefono);
      if (!citas.length) {
        return `😕 No tienes citas activas en este momento.\n\n${MENU_TEXT}`;
      }
      const indexed = citas.map((c, idx) => ({ ...c.toJSON(), idx: idx + 1 }));
      session.datosTemporales.citasActivas = indexed;
      session.estadoActual = BotState.LIST_CITAS;

      let text = "📋 *Tus citas activas*\n\n";
      indexed.forEach((c: any) => {
        const fecha = formatDate(c.horario.fecha);
        const hora = c.horario.horaInicio.slice(0, 5);
        text += `*${c.idx}.* ✂️ ${c.horario.servicio.nombre}\n`;
        text += `   📅 ${fecha} a las ${hora}\n`;
        text += `   📌 ${c.estado}\n\n`;
      });
      text += "Escribe el *número* de la cita que quieres gestionar.";
      return text;
    } catch (error) {
      logger.error("Error listing client citas", { error: String(error) });
      return "😕 No fue posible consultar tus citas. Inténtalo de nuevo.";
    }
  }

  return `👋 ¡Hola, ${nombre}! Bienvenido a *MiTurno* 💈\n\n${MENU_TEXT}`;
}

async function handlerSelectBarber(session: UserSession, input: string): Promise<string> {
  const selectedBarber = session.datosTemporales.barberListMapping?.find(
    (b) => b.idx === parseInt(input),
  );
  if (!selectedBarber) {
    return "🤔 No encontré ese barbero. Responde con el número de la lista.";
  }

  session.datosTemporales.barber = { ...selectedBarber };

  const barberProcedures = (await barberService.getProcedures(selectedBarber.id)).map(
    (p, idx) => ({ ...p, idx: idx + 1 }),
  );
  session.datosTemporales.proceduresList = barberProcedures;

  let text = `✅ Barbero: *${selectedBarber.nombres} ${selectedBarber.apellidos}*\n\n`;
  text += `✂️ *Servicios disponibles:*\n\n`;
  barberProcedures.forEach((b) => {
    text += `*${b.idx}.* ${b.nombre}\n`;
    if (b.descripcion) text += `   📝 _${b.descripcion}_\n`;
    text += `   💵 ${formatCOP(b.precio)}\n\n`;
  });
  text += `👉 Responde con el número del servicio.`;
  session.estadoActual = BotState.SELECT_PROCEDURE;
  return text;
}

async function handlerSelectProcedure(session: UserSession, input: string): Promise<string> {
  const selectedProcedure = session.datosTemporales.proceduresList?.find(
    (b) => b.idx === parseInt(input),
  );
  if (!selectedProcedure) {
    return "🤔 No encontré ese servicio. Responde con el número de la lista.";
  }

  if (!session.datosTemporales.barber && session.datosTemporales.barberListMapping) {
    session.datosTemporales.barber = session.datosTemporales.barberListMapping.find(
      (b) => b.id === selectedProcedure.idBarbero,
    );
  }
  session.datosTemporales.procedure = { ...selectedProcedure };

  let text = `✅ Servicio: *${selectedProcedure.nombre}*\n`;
  if (selectedProcedure.descripcion) text += `📝 _${selectedProcedure.descripcion}_\n`;
  text += `💵 ${formatCOP(selectedProcedure.precio)}  ·  ⏱️ ${selectedProcedure.duracion} min\n\n`;

  const idBarbero = selectedProcedure.idBarbero ?? session.datosTemporales.barber?.id;

  // CU-02: AvailabilityService considera HorarioDia, DiaLibre y reservas existentes
  const procedureDates = await generateAvailableDates(idBarbero, selectedProcedure.duracion);

  if (!procedureDates.length) {
    return `${text}😕 No hay fechas disponibles para este servicio por ahora.\nEscribe *menú* para volver al inicio.`;
  }

  session.datosTemporales.procedureDates = [...procedureDates];
  text += renderDatesList(procedureDates);
  session.estadoActual = BotState.SELECT_DATE;
  return text;
}

async function handleSelectDate(session: UserSession, input: string): Promise<string> {
  const selectedDate = session.datosTemporales.procedureDates?.find(
    (b) => b.idx === parseInt(input),
  );
  if (!selectedDate) {
    return "🤔 Esa opción no es válida. Responde con el número de la fecha.";
  }
  session.datosTemporales.selectedDate = { ...selectedDate };

  const procedure = session.datosTemporales.procedure;
  const idBarbero = procedure.idBarbero ?? session.datosTemporales.barber?.id;

  // CU-02: slots reales del día elegido
  const rawSlots = await availabilityService.getAvailableSlots(
    idBarbero,
    selectedDate.fecha,
    procedure.duracion,
  );
  const timeSlots = rawSlots
    .filter((s) => s.available)
    .slice(0, 11)
    .map((s, idx) => {
      const endMin = toMinutes(s.time) + procedure.duracion;
      return { idx: idx + 1, time: s.time, horaFin: fromMinutes(endMin) };
    });

  if (!timeSlots.length) {
    return "😕 No hay horarios disponibles para esta fecha.\nEscribe *menú* para volver al inicio.";
  }

  session.datosTemporales.timeSlotsList = [...timeSlots];

  let text = `✅ Fecha: *${formatDate(selectedDate.fecha)}*\n\n`;
  text += `🕐 *Horarios disponibles:*\n\n`;
  timeSlots.forEach((b) => {
    text += `*${b.idx}.* ${b.time} – ${b.horaFin}\n`;
  });
  text += `\n👉 Responde con el número del horario.`;
  session.estadoActual = BotState.SELECT_TIME_SLOT;
  return text;
}

async function handleSelectTimeSlot(session: UserSession, input: string): Promise<string> {
  const selectedTimeSlot = session.datosTemporales.timeSlotsList?.find(
    (b) => b.idx === parseInt(input),
  );
  if (!selectedTimeSlot) {
    return "🤔 Esa opción no es válida. Responde con el número del horario.";
  }
  session.datosTemporales.selectedTimeSlot = { ...selectedTimeSlot };

  const procedure = session.datosTemporales.procedure;
  const selectedDate = session.datosTemporales.selectedDate;

  let text = `📋 *Resumen de tu cita*\n\n`;
  text += `✂️ ${procedure.nombre}\n`;
  text += `📅 ${formatDate(selectedDate.fecha)}\n`;
  text += `🕐 ${selectedTimeSlot.time} – ${selectedTimeSlot.horaFin}\n`;
  text += `💵 ${formatCOP(procedure.precio)}\n\n`;
  text += `¿Confirmas tu reserva?\n`;
  text += `✅ *1* Confirmar     🔄 *2* Elegir otra fecha`;
  session.estadoActual = BotState.DATA_CONFIRMATION;
  return text;
}

async function handleDataConfirmation(session: UserSession, input: string): Promise<string> {
  if (input === "1") {
    const user = session.datosTemporales.user;
    const procedure = session.datosTemporales.procedure;
    const selectedDate = session.datosTemporales.selectedDate;
    const selectedTimeSlot = session.datosTemporales.selectedTimeSlot;

    try {
      // CU-03: BookingService valida disponibilidad en transacción SERIALIZABLE
      const { booking, payment } = await bookingService.create({
        idServicio: procedure.id,
        fecha: selectedDate.fecha,
        hora: selectedTimeSlot.time,
        cliente: {
          nombres: user?.nombres ?? "Cliente",
          apellidos: user?.apellidos ?? "-",
          celular: session.telefono,
          email: user?.email ?? `${session.telefono}@miturno.local`,
        },
      });

      const paymentLink = await paymentService.createPaymentLink({
        id: booking.id,
        precio: payment.monto,
      });

      session.estadoActual = BotState.INICIO;
      session.datosTemporales = {};

      let message = `🎉 *¡Cita agendada!*\n\n`;
      message += `Para confirmarla, abona el *50%* (${formatCOP(payment.monto)}) con este enlace:\n`;
      message += `💳 ${paymentLink}\n\n`;
      message += `¡Gracias por reservar en *MiTurno*! 💈`;
      return message;
    } catch (error: any) {
      // CU-03 FA-03: race condition — horario tomado por otro cliente
      if (error?.statusCode === 409 || error?.message?.includes("disponible")) {
        session.estadoActual = BotState.SELECT_TIME_SLOT;
        session.datosTemporales.timeSlotsList = undefined;
        return "😕 Lo sentimos, ese horario acaba de ser tomado. Por favor elige otro.\nVuelve a seleccionar una fecha para ver los horarios disponibles.";
      }
      logger.error("Error creating booking", { error: String(error) });
      return "😕 Ocurrió un error al agendar tu cita. Inténtalo de nuevo o escribe *menú*.";
    }
  }

  if (input === "2") {
    const dates = session.datosTemporales.procedureDates;
    if (!dates?.length) {
      session.estadoActual = BotState.INICIO;
      return "😕 No hay fechas disponibles por ahora.\nEscribe *menú* para volver al inicio.";
    }
    session.estadoActual = BotState.SELECT_DATE;
    return `🔄 Sin problema, elige otra fecha.\n\n${renderDatesList(dates)}`;
  }

  return "🤔 Opción no válida. Responde *1* para confirmar o *2* para cambiar la fecha.";
}

// ─── CU-05: CANCELAR / REPROGRAMAR ───────────────────────────────────────────

async function handleListCitas(session: UserSession, input: string): Promise<string> {
  const citas = session.datosTemporales.citasActivas;
  if (!citas?.length) {
    session.estadoActual = BotState.INICIO;
    return "Sesión expirada. Escribe *menú* para volver al inicio.";
  }

  const idx = parseInt(input);
  const cita = citas.find((c: any) => c.idx === idx);
  if (!cita) {
    return `🤔 Número inválido. Escribe el número de la cita (1–${citas.length}).`;
  }

  session.datosTemporales.selectedCita = cita;
  session.estadoActual = BotState.CANCEL_CONFIRM;

  const fecha = formatDate(cita.horario.fecha);
  const hora = cita.horario.horaInicio.slice(0, 5);

  let text = `📋 *Cita seleccionada*\n\n`;
  text += `✂️ ${cita.horario.servicio.nombre}\n`;
  text += `📅 ${fecha} a las ${hora}\n`;
  text += `📌 Estado: ${cita.estado}\n\n`;
  text += `¿Qué deseas hacer?\n`;
  text += `*1.* ❌ Cancelar cita\n`;
  text += `*2.* 🔄 Reprogramar cita\n`;
  text += `↩️ Escribe *menú* para volver al inicio.`;
  return text;
}

async function handleCancelConfirm(session: UserSession, input: string): Promise<string> {
  const cita = session.datosTemporales.selectedCita;
  if (!cita) {
    session.estadoActual = BotState.INICIO;
    return "Sesión expirada. Escribe *menú* para volver al inicio.";
  }

  if (input === "1") {
    // CU-05: validar política de 24 horas
    const horario = cita.horario;
    const apptDate = new Date(`${horario.fecha}T${horario.horaInicio.slice(0, 5)}:00`);
    const diffHours = (apptDate.getTime() - Date.now()) / 3_600_000;

    if (diffHours < 24) {
      session.estadoActual = BotState.INICIO;
      return `❌ No es posible cancelar con menos de 24 horas de anticipación. Tu cita se mantiene.\n\n${MENU_TEXT}`;
    }

    try {
      const idBarbero = cita.horario.servicio.idBarbero;
      await bookingService.updateStatus(cita.id, idBarbero, "cancelada");
      session.estadoActual = BotState.INICIO;
      session.datosTemporales = {};
      return `✅ Tu cita ha sido cancelada exitosamente. ¡Esperamos verte pronto!\n\n${MENU_TEXT}`;
    } catch (error) {
      logger.error("Error cancelling cita", { error: String(error) });
      return "😕 No fue posible cancelar la cita. Inténtalo de nuevo o escribe *menú*.";
    }
  }

  if (input === "2") {
    const procedure = cita.horario.servicio;
    const dates = await generateAvailableDates(procedure.idBarbero, procedure.duracion);
    if (!dates.length) {
      session.estadoActual = BotState.INICIO;
      return `😕 No hay fechas disponibles para reprogramar. Tu cita se mantiene.\n\n${MENU_TEXT}`;
    }
    session.datosTemporales.procedureDates = dates;
    session.estadoActual = BotState.RESCHEDULE_DATE;
    return `🔄 *Reprogramar cita*\n\n${renderDatesList(dates)}`;
  }

  return "🤔 Opción no válida. Responde *1* para cancelar o *2* para reprogramar.";
}

async function handleRescheduleDate(session: UserSession, input: string): Promise<string> {
  const selectedDate = session.datosTemporales.procedureDates?.find(
    (d: any) => d.idx === parseInt(input),
  );
  if (!selectedDate) {
    return "🤔 Fecha inválida. Responde con el número de la fecha.";
  }

  const cita = session.datosTemporales.selectedCita;
  const procedure = cita.horario.servicio;

  const rawSlots = await availabilityService.getAvailableSlots(
    procedure.idBarbero,
    selectedDate.fecha,
    procedure.duracion,
  );
  const timeSlots = rawSlots
    .filter((s) => s.available)
    .slice(0, 11)
    .map((s, idx) => {
      const endMin = toMinutes(s.time) + procedure.duracion;
      return { idx: idx + 1, time: s.time, horaFin: fromMinutes(endMin) };
    });

  if (!timeSlots.length) {
    const dates = session.datosTemporales.procedureDates ?? [];
    return `😕 No hay horarios disponibles en esa fecha. Elige otra.\n\n${renderDatesList(dates)}`;
  }

  session.datosTemporales.selectedDate = selectedDate;
  session.datosTemporales.timeSlotsList = timeSlots;
  session.estadoActual = BotState.RESCHEDULE_TIME;

  let text = `✅ Fecha: *${formatDate(selectedDate.fecha)}*\n\n`;
  text += `🕐 *Horarios disponibles:*\n\n`;
  timeSlots.forEach((t) => {
    text += `*${t.idx}.* ${t.time} – ${t.horaFin}\n`;
  });
  text += `\n👉 Responde con el número del horario.`;
  return text;
}

async function handleRescheduleTime(session: UserSession, input: string): Promise<string> {
  const selectedSlot = session.datosTemporales.timeSlotsList?.find(
    (t: any) => t.idx === parseInt(input),
  );
  if (!selectedSlot) {
    return "🤔 Horario inválido. Responde con el número del horario.";
  }

  const cita = session.datosTemporales.selectedCita;
  const selectedDate = session.datosTemporales.selectedDate;

  try {
    await bookingService.reschedule(cita.id, selectedDate.fecha, selectedSlot.time);

    session.estadoActual = BotState.INICIO;
    session.datosTemporales = {};

    return (
      `✅ ¡Cita reprogramada!\n📅 ${formatDate(selectedDate.fecha)} a las ${selectedSlot.time}\n\n` +
      `¡Te esperamos en *MiTurno*! 💈\n\n` +
      MENU_TEXT
    );
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.message?.includes("disponible")) {
      session.estadoActual = BotState.RESCHEDULE_DATE;
      const dates = session.datosTemporales.procedureDates ?? [];
      return `😕 Ese horario ya fue tomado. Por favor elige otra fecha.\n\n${renderDatesList(dates)}`;
    }
    logger.error("Error rescheduling cita", { error: String(error) });
    return "😕 No fue posible reprogramar la cita. Inténtalo de nuevo o escribe *menú*.";
  }
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export const FAQ: Record<string, string> = {
  faq_horario: "🕐 Atendemos de Lunes a Viernes de 8am a 6pm.",
  faq_precio: "💰 Nuestros planes inician desde $12.000 COP.",
  faq_ubicacion: "📍 Estamos en Calle 123 #45-67, Bogotá.",
  faq_contacto: "📞 Llámanos al 300-123-4567 o escribe a soporte@miturno.com",
};
