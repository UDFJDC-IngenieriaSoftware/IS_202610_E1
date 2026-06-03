import { BotState, UserSession } from "./bot.types";
import { Servicio, Cliente, Barbero, Horario, Cita, Pago } from "../models";
import { ProcedureService } from "../services/procedure.service";
import { BarberService } from "../services/barber.service";
import { TimeSlotService } from "../services/time-slot.service";
import { AppointmentService } from "../services/appointment.service";
import { UserService } from "../services/user.service";
import { deleteSession } from "../services/session.service";
import { PaymentService } from "../services/payment.service";

const procedureService = new ProcedureService(new Servicio());
const barberService = new BarberService(procedureService);
const timeSlotService = new TimeSlotService();
const appointmentService = new AppointmentService();
const userService = new UserService();
const paymentService = new PaymentService();

const formatCOP = (value: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

// Renderiza la lista de fechas disponibles (sin cambiar el estado).
const renderDatesList = (
  dates: { idx: number; fecha: string }[],
): string => {
  let text = `📅 *Próximas fechas disponibles:*\n\n`;
  dates.forEach((d) => {
    text += `*${d.idx}.* ${d.fecha}\n`;
  });
  text += `\n👉 Responde con el número de la fecha.`;
  return text;
};

// --- HANDLERS DE CADA ESTADO ---

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
};

// ─── IMPLEMENTACIÓN DE LOS HANDLERS DE DIÁLOGO ───────────────────────────────

async function handleInicio(
  session: UserSession,
  input: string,
): Promise<string> {
  session.datosTemporales.user = await userService.getUserByPhone(
    session.telefono,
  );

  if (input === "1") {
    let barberos = await barberService.getAllBarbers();
    barberos = barberos.map((b, idx) => ({ ...b, idx: idx + 1 }));
    let text = `💈 *Nuestro equipo* 💈\n\n`;

    barberos.forEach((b) => {
      text += `*${b.idx}.* ${b.nombres} ${b.apellidos}\n`;
    });

    session.datosTemporales.barberListMapping = barberos;
    session.estadoActual = BotState.SELECT_BARBER;

    text += `\n👉 Responde con el número del barbero.\n`;
    text += `↩️ Escribe *menú* para volver al inicio.`;
    return text.trim();
  }

  if (input === "2") {
    const procedures = (await procedureService.getServicesMenuText())
      .slice(0, 11)
      .map((p, idx) => ({ ...p, idx: idx + 1 }));

    const barbeList = procedures.map((p, idx) => ({
      ...p.barbero,
      idx: idx + 1,
    }));

    session.datosTemporales.barberListMapping = [...barbeList];

    session.datosTemporales.proceduresList = [...procedures];

    let mensaje = `✂️ *Nuestros servicios* ✂️\n\n`;

    procedures.forEach((serv) => {
      const barberName = serv.barbero
        ? `${serv.barbero.nombres} ${serv.barbero.apellidos}`
        : "Barbero";

      mensaje += `*${serv.idx}.* ${serv.nombre} — _con ${barberName}_\n`;
      if (serv.descripcion) {
        mensaje += `   📝 ${serv.descripcion}\n`;
      }
      mensaje += `   💵 ${formatCOP(serv.precio)}  ·  ⏱️ ${serv.duracion} min\n\n`;
    });

    mensaje += `👉 Responde con el número del servicio.`;
    session.estadoActual = BotState.SELECT_PROCEDURE;
    return mensaje;
  }

  return "👋 ¡Hola! Escribe *menú* para ver lo que podemos hacer por ti.";
}

async function handlerSelectBarber(
  session: UserSession,
  input: string,
): Promise<string> {
  const selectedBarber = session.datosTemporales.barberListMapping?.find(
    (b) => b.idx === parseInt(input),
  );
  if (!selectedBarber) {
    return "🤔 No encontré ese barbero. Responde con el número de la lista.";
  }

  session.datosTemporales.barber = { ...selectedBarber };

  let barberProcedures = (
    await barberService.getProcedures(selectedBarber.id)
  ).map((p, idx) => ({ ...p, idx: idx + 1 }));

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

async function handlerSelectProcedure(
  session: UserSession,
  input: string,
): Promise<string> {
  const selectedProcedure = session.datosTemporales.proceduresList?.find(
    (b) => b.idx === parseInt(input),
  );
  if (!selectedProcedure) {
    return "🤔 No encontré ese servicio. Responde con el número de la lista.";
  }

  if (
    !session.datosTemporales.barber &&
    session.datosTemporales.barberListMapping
  ) {
    session.datosTemporales.barber =
      session.datosTemporales.barberListMapping.find(
        (b) => b.id === selectedProcedure.idBarbero,
      );
  }

  session.datosTemporales.procedure = { ...selectedProcedure };

  let text = `✅ Servicio: *${selectedProcedure.nombre}*\n`;
  if (selectedProcedure.descripcion)
    text += `📝 _${selectedProcedure.descripcion}_\n`;
  text += `💵 ${formatCOP(selectedProcedure.precio)}  ·  ⏱️ ${selectedProcedure.duracion} min\n\n`;

  const procedureDates = (await timeSlotService.getDates(selectedProcedure.id))
    .map((p, idx) => ({ ...p, idx: idx + 1 }))
    .slice(0, 6);

  if (!procedureDates || !procedureDates.length)
    return "😕 No hay fechas disponibles para este servicio por ahora.\nEscribe *menú* para volver al inicio.";

  session.datosTemporales.procedureDates = [...procedureDates];

  text += renderDatesList(procedureDates);

  session.estadoActual = BotState.SELECT_DATE;

  return text;
}

async function handleSelectDate(
  session: UserSession,
  input: string,
): Promise<string> {
  const selectedDate = session.datosTemporales.procedureDates?.find(
    (b) => b.idx === parseInt(input),
  );
  if (!selectedDate) {
    return "🤔 Esa opción no es válida. Responde con el número de la fecha.";
  }

  session.datosTemporales.selectedDate = { ...selectedDate };

  let text = `✅ Fecha: *${selectedDate.fecha}*\n\n`;

  const timeSlots = (
    await timeSlotService.getProcedureTimeslotsByDate(
      session.datosTemporales.procedure.id,
      selectedDate.fecha,
    )
  )
    .map((t, idx) => ({ ...t, idx: idx + 1 }))
    .slice(0, 11);

  if (!timeSlots || !timeSlots.length)
    return "😕 No hay horarios disponibles para esta fecha.\nEscribe *menú* para volver al inicio.";

  session.datosTemporales.timeSlotsList = [...timeSlots];

  text += `🕐 *Horarios disponibles:*\n\n`;

  timeSlots.forEach((b) => {
    text += `*${b.idx}.* ${b.horaInicio} – ${b.horaFin}\n`;
  });

  text += `\n👉 Responde con el número del horario.`;

  session.estadoActual = BotState.SELECT_TIME_SLOT;

  return text;
}

async function handleSelectTimeSlot(
  session: UserSession,
  input: string,
): Promise<string> {
  const selectedTimeSlot = session.datosTemporales.timeSlotsList?.find(
    (b) => b.idx === parseInt(input),
  );
  if (!selectedTimeSlot) {
    return "🤔 Esa opción no es válida. Responde con el número del horario.";
  }

  session.datosTemporales.selectedTimeSlot = { ...selectedTimeSlot };

  let text = `📋 *Resumen de tu cita*\n\n`;
  text += `📅 ${selectedTimeSlot.fecha}\n`;
  text += `🕐 ${selectedTimeSlot.horaInicio} – ${selectedTimeSlot.horaFin}\n\n`;
  text += `¿Confirmas tu reserva?\n`;
  text += `✅ *1* Confirmar     🔄 *2* Elegir otra fecha`;

  session.estadoActual = BotState.DATA_CONFIRMATION;

  return text;
}

async function handleDataConfirmation(
  session: UserSession,
  input: string,
): Promise<string> {
  if (input === "1") {
    const appointmentData = {
      precio: session.datosTemporales.procedure.precio,
      idHorario: session.datosTemporales.selectedTimeSlot.id,
      idCliente: session.datosTemporales.user.id,
    };
    const newAppointment = await appointmentService.create(appointmentData);

    const paymentLink = await paymentService.createPaymentLink({
      id: newAppointment.id,
      precio: appointmentData.precio,
    });

    let message = `🎉 *¡Cita agendada!*\n\n`;
    message += `Para confirmarla, abona el *50%* con este enlace:\n`;
    message += `💳 ${paymentLink}\n\n`;
    message += `¡Gracias por reservar en *MiTurno*! 💈`;

    return message;
  }

  if (input === "2") {
    const dates = session.datosTemporales.procedureDates;
    if (!dates || !dates.length) {
      session.estadoActual = BotState.INICIO;
      return "😕 No hay fechas disponibles por ahora.\nEscribe *menú* para volver al inicio.";
    }
    session.estadoActual = BotState.SELECT_DATE;
    return `🔄 Sin problema, cambiemos la fecha.\n\n${renderDatesList(dates)}`;
  }

  return "🤔 Opción no válida. Responde *1* para confirmar o *2* para cambiar la fecha.";
}

export const FAQ: Record<string, string> = {
  faq_horario: "🕐 Atendemos de Lunes a Viernes de 8am a 6pm.",
  faq_precio: "💰 Nuestros planes inician desde $12.000 COP.",
  faq_ubicacion: "📍 Estamos en Calle 123 #45-67, Bogotá.",
  faq_contacto: "📞 Llámanos al 300-123-4567 o escribe a soporte@miturno.com",
};
