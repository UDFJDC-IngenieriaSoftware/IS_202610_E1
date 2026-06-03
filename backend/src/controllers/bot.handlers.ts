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
    let text = `💈 *Nuestros Barberos en MiTurno* 💈\n`;
    text += `Aquí tienes a nuestro equipo de profesionales disponibles:\n\n`;

    barberos.forEach((b) => {
      text += `• ${b.idx} - *${b.nombres} ${b.apellidos}*\n`;
      text += `   📞 Celular: ${b.celular}\n`;
      if (b.email) text += `   📧 Email: ${b.email}\n`;
      text += `\n`;
    });

    session.datosTemporales.barberListMapping = barberos;
    session.estadoActual = BotState.SELECT_BARBER;

    text += `👉 Selecciona el número del barbero que deseas`;
    text += `👉 Escribe *menú* para regresar al inicio.`;
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

    let mensaje = `💈 *Nuestros Servicios - MiTurno* 💈\n`;
    mensaje += `Aquí tienes el menú de servicios disponibles que puedes reservar:\n\n`;

    procedures.forEach((serv) => {
      const barberName = serv.barbero
        ? `${serv.barbero.nombres} ${serv.barbero.apellidos}`
        : "Barbero";

      const precioFormateado = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(serv.precio);

      mensaje += `${serv.idx} 🔹 *${serv.nombre}* (por ${barberName})\n`;
      if (serv.descripcion) {
        mensaje += `   📝 _${serv.descripcion}_\n`;
      }
      mensaje += `   💵 Precio: ${precioFormateado}\n`;
      mensaje += `   ⏱️ Duración: ${serv.duracion} minutos\n\n`;
    });

    mensaje += `👉 Escribe el número del servicio que te interesa.`;
    session.estadoActual = BotState.SELECT_PROCEDURE;
    return mensaje;
  }

  return "👋 Escribe *hola* o *menú* para ver las opciones disponibles de nuestro servicio.";
}

async function handlerSelectBarber(
  session: UserSession,
  input: string,
): Promise<string> {
  const selectedBarber = session.datosTemporales.barberListMapping?.find(
    (b) => b.idx === parseInt(input),
  );
  if (!selectedBarber) {
    throw new Error("No existe el barbero");
  }

  session.datosTemporales.barber = { ...selectedBarber };

  let barberProcedures = (
    await barberService.getProcedures(selectedBarber.id)
  ).map((p, idx) => ({ ...p, idx: idx + 1 }));

  session.datosTemporales.proceduresList = barberProcedures;

  let text = "";

  text += `barbero seleccionado ${selectedBarber.nombres} ${selectedBarber.apellidos} \n`;

  text += "Estos son los servicios que ofrece el barbero \n";

  barberProcedures.forEach((b) => {
    text += `• ${b.idx} - *${b.nombre}*\n`;
    text += `descripción: - ${b.descripcion}\n`;
    text += `Precio: ${b.precio}\n`;
    text += `\n`;
  });

  text += "Selecciona el servicio que deseas\n";

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
    throw new Error("No existe el servicio deseado");
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

  let text = "";

  text += `Servicio seleccionado: *${selectedProcedure.nombre}*\n`;

  text += "Detalles \n";
  text += `Descripción: ${selectedProcedure.descripcion}\n`;
  text += `Precio: ${selectedProcedure.precio}\n`;
  text += `duracion: ${selectedProcedure.duracion}\n`;

  const procedureDates = (await timeSlotService.getDates(selectedProcedure.id))
    .map((p, idx) => ({ ...p, idx: idx + 1 }))
    .slice(0, 6);

  if (!procedureDates || !procedureDates.length)
    return "No hay fechas disponibles para este servicio\n";

  session.datosTemporales.procedureDates = [...procedureDates];

  text += "Éstas son las próximas fechas disponibles:\n";

  procedureDates.forEach((d) => {
    text += `*${d.idx}.* ${d.fecha}\n`;
    text += `\n`;
  });

  text += "Selecciona la fecha deseada\n";

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
    throw new Error("La opción no es correcta");
  }

  session.datosTemporales.selectedDate = { ...selectedDate };

  let text = "";

  text += `fecha seleccionada: *${selectedDate.fecha}*\n`;

  const timeSlots = (
    await timeSlotService.getProcedureTimeslotsByDate(
      session.datosTemporales.procedure.id,
      selectedDate.fecha,
    )
  )
    .map((t, idx) => ({ ...t, idx: idx + 1 }))
    .slice(0, 11);

  if (!timeSlots || !timeSlots.length)
    return "No hay horarios disponibles para este servicio\n";

  session.datosTemporales.timeSlotsList = [...timeSlots];

  text += "Estos son los horarios disponibles:\n";

  timeSlots.forEach((b) => {
    text += `*${b.idx}.*\n`;
    text += `hora inicio: ${b.horaInicio}\n`;
    text += `hora fin: ${b.horaFin}\n`;
    text += `\n`;
  });

  text += "Selecciona el horario deseado\n";

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
    throw new Error("La opción no es correcta");
  }

  session.datosTemporales.selectedTimeSlot = { ...selectedTimeSlot };

  let text = "";

  text += `horario y fecha seleccionados para el servicio: *${selectedTimeSlot.fecha}: ${selectedTimeSlot.horaInicio} -> ${selectedTimeSlot.horaFin}*\n`;

  text += "¿Confirmas los datos? oprime *1*, 2 para horarios";
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

    let message =
      "Recuerda que debes abonar un 50% para completar el agendamiento\n";

    message += `-> link de pago: ${paymentLink}\n`;

    return message;
  }

  if (input === "2") {
    session.estadoActual = BotState.SELECT_DATE;

    return "Select date\n";
  }

  return "";
}

export const FAQ: Record<string, string> = {
  faq_horario: "🕐 Atendemos de Lunes a Viernes de 8am a 6pm.",
  faq_precio: "💰 Nuestros planes inician desde $12.000 COP.",
  faq_ubicacion: "📍 Estamos en Calle 123 #45-67, Bogotá.",
  faq_contacto: "📞 Llámanos al 300-123-4567 o escribe a soporte@miturno.com",
};
