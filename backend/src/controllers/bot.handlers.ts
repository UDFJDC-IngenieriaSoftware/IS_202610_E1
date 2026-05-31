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
  [BotState.AGENDANDO_SELECCIONANDO_SERVICIO]:
    handleAgendandoSeleccionandoServicio,
  [BotState.AGENDANDO_SELECCIONANDO_HORARIO]:
    handleAgendandoSeleccionandoHorario,
  [BotState.AGENDANDO_INGRESANDO_NOMBRE]: handleAgendandoIngresandoNombre,
  [BotState.AGENDANDO_INGRESANDO_APELLIDO]: handleAgendandoIngresandoApellido,
  [BotState.AGENDANDO_CONFIRMANDO]: handleAgendandoConfirmando,
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

  if (input === "3") {
    // Transicionar al paso 1 del agendamiento
    session.estadoActual = BotState.AGENDANDO_SELECCIONANDO_SERVICIO;

    const servicios = await Servicio.findAll({
      include: ["barbero"],
    });

    let text = `📆 *Agendando Cita - Paso 1: Selecciona el Servicio* 💇‍♂️\n`;
    text += `Por favor, elige el número del servicio que deseas reservar:\n\n`;

    const mapping: string[] = [];
    servicios.forEach((serv, idx) => {
      const servJson = serv.toJSON() as any;
      const num = idx + 1;
      mapping.push(servJson.id);

      const precioFormateado = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(servJson.precio);

      const barberName = servJson.barbero
        ? `${servJson.barbero.nombres} ${servJson.barbero.apellidos}`
        : "Barbero";

      text += `*${num}.* ${servJson.nombre} (${precioFormateado})\n`;
      text += `   🧔 Barbero: ${barberName}\n\n`;
    });

    // Guardar mapeo de números a UUIDs en la sesión
    session.datosTemporales.listaServiciosMapping = mapping;

    text += `👉 Escribe *cancelar* en cualquier momento para abortar la reserva.`;
    return text.trim();
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

    const newPayment = await paymentService.createPayment({
      id: newAppointment.id,
      precio: appointmentData.precio,
    });

    const paymentLink = await paymentService.createPaymentLink(newPayment);

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

async function handleAgendandoSeleccionandoServicio(
  session: UserSession,
  input: string,
): Promise<string> {
  const index = parseInt(input, 10) - 1;
  const mapping = session.datosTemporales.listaServiciosMapping;

  if (isNaN(index) || !mapping || index < 0 || index >= mapping.length) {
    return "⚠️ Opción inválida. Por favor, escribe un número de la lista anterior para seleccionar el servicio:";
  }

  const servicioId = mapping[index];

  // Buscar servicio con su barbero para guardar detalles en la sesión
  const servicio = await Servicio.findByPk(servicioId, {
    include: ["barbero"],
  });
  if (!servicio) {
    session.estadoActual = BotState.INICIO;
    session.datosTemporales = {};
    return "❌ Error: El servicio seleccionado ya no está disponible. Escribe *menú* para iniciar de nuevo.";
  }

  const servJson = servicio.toJSON() as any;
  session.datosTemporales.servicioId = servJson.id;
  session.datosTemporales.servicioNombre = servJson.nombre;
  session.datosTemporales.precioCita = servJson.precio;
  session.datosTemporales.barberoNombre = servJson.barbero
    ? `${servJson.barbero.nombres} ${servJson.barbero.apellidos}`
    : "Barbero";

  // Buscar horarios disponibles para este servicio específico
  const horarios = await Horario.findAll({
    where: { idServicio: servicioId, estado: "disponible" },
    order: [
      ["fecha", "ASC"],
      ["horaInicio", "ASC"],
    ],
  });

  if (!horarios.length) {
    const barberoNombre = session.datosTemporales.barberoNombre || "Barbero";
    session.estadoActual = BotState.INICIO;
    session.datosTemporales = {};
    return `😔 Lo sentimos, en este momento el barbero *${barberoNombre}* no tiene bloques de horarios libres cargados para *${servJson.nombre}*.\n\nEscribe *menú* para elegir otro servicio o barbero.`;
  }

  // Transicionar al paso 2
  session.estadoActual = BotState.AGENDANDO_SELECCIONANDO_HORARIO;

  let text = `📆 *Agendando Cita - Paso 2: Selecciona el Horario* ⏰\n`;
  text += `Servicio seleccionado: *${servJson.nombre}*\n`;
  text += `Elige el número del bloque de horario que más te convenga:\n\n`;

  const horariosMapping: string[] = [];
  horarios.forEach((h, idx) => {
    const hJson = h.toJSON() as any;
    const num = idx + 1;
    horariosMapping.push(hJson.id);

    // Formatear hora de inicio (remover segundos de tipo TIME)
    const horaShort = hJson.horaInicio.substring(0, 5);
    const horaFinShort = hJson.horaFin.substring(0, 5);

    text += `*${num}.* Día: ${hJson.fecha} ➡️ Hora: ${horaShort} - ${horaFinShort}\n`;
  });

  session.datosTemporales.listaHorariosMapping = horariosMapping;

  text += `\n👉 Elige el número de tu opción:`;
  return text.trim();
}

async function handleAgendandoSeleccionandoHorario(
  session: UserSession,
  input: string,
): Promise<string> {
  const index = parseInt(input, 10) - 1;
  const mapping = session.datosTemporales.listaHorariosMapping;

  if (isNaN(index) || !mapping || index < 0 || index >= mapping.length) {
    return "⚠️ Opción inválida. Por favor, escribe un número de la lista de horarios:";
  }

  const horarioId = mapping[index];
  const horario = await Horario.findByPk(horarioId);
  if (!horario || horario.estado !== "disponible") {
    return "⚠️ Ese horario acaba de ser tomado o no está disponible. Por favor, selecciona otra opción de la lista:";
  }

  const hJson = horario.toJSON() as any;
  session.datosTemporales.horarioId = hJson.id;
  session.datosTemporales.fechaHorario = hJson.fecha;
  session.datosTemporales.horaInicio = hJson.horaInicio.substring(0, 5);

  // Transicionar al paso 3: Solicitar Datos Personales
  session.estadoActual = BotState.AGENDANDO_INGRESANDO_NOMBRE;

  return (
    `📆 *Agendando Cita - Paso 3: Tus Datos* 👤\n\n` +
    `¡Excelente elección!\n` +
    `Por favor, escribe tu *Nombre* (primer nombre):`
  );
}

async function handleAgendandoIngresandoNombre(
  session: UserSession,
  input: string,
): Promise<string> {
  if (input.length < 2) {
    return "⚠️ El nombre ingresado es muy corto. Escribe tu primer nombre:";
  }

  session.datosTemporales.nombres = input;

  // Transicionar al paso de Apellidos
  session.estadoActual = BotState.AGENDANDO_INGRESANDO_APELLIDO;

  return (
    `📆 *Agendando Cita - Paso 3: Tus Datos* 👤\n\n` +
    `Gracias, *${input}*.\n` +
    `Ahora, escribe tus *Apellidos*:`
  );
}

async function handleAgendandoIngresandoApellido(
  session: UserSession,
  input: string,
): Promise<string> {
  if (input.length < 2) {
    return "⚠️ El apellido ingresado es muy corto. Escribe tus apellidos:";
  }

  session.datosTemporales.apellidos = input;

  // Transicionar al paso de Confirmación Final
  session.estadoActual = BotState.AGENDANDO_CONFIRMANDO;

  const t = session.datosTemporales;
  const precioFormateado = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(t.precioCita || 0);

  let text = `📆 *Agendando Cita - Paso 4: Confirmación* 💎\n\n`;
  text += `Por favor, revisa detalladamente que tu reserva sea correcta:\n\n`;
  text += `💇‍♂️ *Servicio:* ${t.servicioNombre}\n`;
  text += `🧔 *Barbero:* ${t.barberoNombre}\n`;
  text += `📅 *Fecha:* ${t.fechaHorario}\n`;
  text += `⏰ *Hora:* ${t.horaInicio}\n`;
  text += `👤 *Cliente:* ${t.nombres} ${t.apellidos}\n`;
  text += `💵 *Tarifa:* ${precioFormateado} COP\n\n`;
  text +=
    `¿Confirmas esta reservación?\n` +
    `Escribe *SI* para agendarla, o *NO* para cancelarla:`;

  return text.trim();
}

async function handleAgendandoConfirmando(
  session: UserSession,
  input: string,
): Promise<string> {
  const inputLower = input.toLowerCase().trim();

  if (inputLower === "si") {
    try {
      const t = session.datosTemporales;

      // 1. Obtener o registrar al Cliente mediante su celular
      let cliente = await Cliente.findOne({
        where: { celular: session.telefono },
      });
      if (!cliente) {
        cliente = await Cliente.create({
          nombres: t.nombres || "Cliente",
          apellidos: t.apellidos || "MiTurno",
          celular: session.telefono,
          email: `${session.telefono}@miturno.com`,
        });
      }

      // 2. Crear la Cita ligada al Horario y Cliente con el precio congelado, inicialmente 'pendiente'
      const cita = await Cita.create({
        estado: "pendiente",
        precio: t.precioCita || 0,
        idHorario: t.horarioId || "",
        idCliente: cliente.id,
      });

      // 3. Marcar el bloque del Horario como 'reservado'
      await Horario.update(
        { estado: "reservado" },
        { where: { id: t.horarioId } },
      );

      // 4. Crear el registro de Pago en la base de datos
      const pago = await Pago.create({
        idCita: cita.id,
        monto: t.precioCita || 0,
        estado: "pendiente",
        referencia: `miturno-${cita.id}-${Date.now()}`,
      });

      // 5. Generar enlace de pago usando PaymentService
      const paymentService = new PaymentService();
      const paymentUrl = await paymentService.createPaymentLink(pago);

      // 6. Limpiar la sesión activa del usuario en Redis
      await deleteSession(session.telefono);

      const precioFormateado = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(t.precioCita || 0);

      if (paymentUrl) {
        return (
          `🎉 ¡Excelente, *${t.nombres}*! Tu cita ha sido registrada temporalmente.\n\n` +
          `💳 Para confirmar tu reservación, por favor realiza el pago del anticipo de *${precioFormateado}* ingresando al siguiente enlace seguro de Wompi:\n` +
          `🔗 ${paymentUrl}\n\n` +
          `⏳ Tienes 15 minutos para completar el pago. Una vez aprobado, tu cita se confirmará automáticamente y recibirás un mensaje de confirmación por este medio.`
        );
      } else {
        // Fallback: Confirmación directa si la pasarela no está configurada en este entorno
        await cita.update({ estado: "confirmada" });
        return (
          `🎉 ¡Excelente, *${t.nombres}*! Tu cita ha sido agendada y confirmada con éxito (Modo offline).\n\n` +
          `Te esperamos con gusto en la barbería en la fecha elegida. Si necesitas algo más, escribe *hola* para ver el menú principal.`
        );
      }
    } catch (error) {
      console.error("Error al crear cita:", error);
      session.estadoActual = BotState.INICIO;
      session.datosTemporales = {};
      return "❌ Ocurrió un error inesperado al procesar tu reservación en nuestro sistema. Por favor escribe *menú* para intentarlo nuevamente.";
    }
  }

  if (inputLower === "no") {
    await deleteSession(session.telefono);
    return "❌ Reservación cancelada. Si deseas realizar otra consulta o agendar más adelante, escribe *menú*. ¡Que tengas un excelente día!";
  }

  return "⚠️ Respuesta inválida. Por favor, escribe únicamente *SI* para confirmar la cita, o *NO* para cancelarla:";
}

export const FAQ: Record<string, string> = {
  faq_horario: "🕐 Atendemos de Lunes a Viernes de 8am a 6pm.",
  faq_precio: "💰 Nuestros planes inician desde $12.000 COP.",
  faq_ubicacion: "📍 Estamos en Calle 123 #45-67, Bogotá.",
  faq_contacto: "📞 Llámanos al 300-123-4567 o escribe a soporte@miturno.com",
};
