import { BotState, UserSession } from "./bot.types";
import { Servicio, Cliente, Barbero, Horario, Cita } from "../models";
import { ProcedureService } from "../services/procedure.service";
import { BarberService } from "../services/barber.service";
import { TimeSlotService } from "../services/time-slot.service";

const procedureService = new ProcedureService(new Servicio());
const barberService = new BarberService(procedureService);
const timeSlotService = new TimeSlotService();
// --- HANDLERS DE CADA ESTADO ---

export const StateHandlers: Record<
  BotState,
  (session: UserSession, input: string) => Promise<string>
> = {
  [BotState.INICIO]: handleInicio,
  [BotState.SELECT_BARBER]: handlerSelectBarber,
  [BotState.SELECT_PROCEDURE]: handlerSelectProcedure,
  [BotState.SELECT_TIME_SLOT]: handlerSelectProcedure,
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
    return await procedureService.getServicesMenuText();
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

  session.datosTemporales.procedure = { ...selectedProcedure };

  let text = "";

  text += `Servicio seleccionado: *${selectedProcedure.nombre}*\n`;

  text += "Detalles \n";
  text += `Descripción: ${selectedProcedure.descripcion}\n`;
  text += `Precio: ${selectedProcedure.precio}\n`;
  text += `duracion: ${selectedProcedure.duracion}\n`;

  const timeSlots = (
    await timeSlotService.getProcedureTimeslots(selectedProcedure.id)
  ).map((t, idx) => ({ ...t, idx: idx + 1 }));

  if (!timeSlots || !timeSlots.length)
    return "No hay horarios disponibles para este servicio\n";

  session.datosTemporales.timeSlotsList = [...timeSlots];

  text += "Estos son los horarios disponibles:\n";

  timeSlots.forEach((b) => {
    text += `*${b.idx}.*\n`;
    text += `fecha: - ${b.fecha}\n`;
    text += `hora inicio: ${b.horaInicio}\n`;
    text += `hora fin: ${b.horaFin}\n`;
    text += `\n`;
  });

  text += "Selecciona el horario deseado\n";

  session.estadoActual = BotState.SELECT_TIME_SLOT;

  return text;
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
    session.estadoActual = BotState.INICIO;
    session.datosTemporales = {};
    return `😔 Lo sentimos, en este momento el barbero *${session.datosTemporales.barberoNombre}* no tiene bloques de horarios libres cargados para *${servJson.nombre}*.\n\nEscribe *menú* para elegir otro servicio o barbero.`;
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

      // 2. Crear la Cita ligada al Horario y Cliente con el precio congelado
      await Cita.create({
        estado: "confirmada",
        precio: t.precioCita || 0,
        idHorario: t.horarioId || "",
        idCliente: cliente.id,
      });

      // 3. Marcar el bloque del Horario como 'reservado'
      await Horario.update(
        { estado: "reservado" },
        { where: { id: t.horarioId } },
      );

      // 4. Limpiar la sesión activa del usuario para liberar memoria
      sesionesActivas.delete(session.telefono);

      return (
        `🎉 ¡Excelente, *${t.nombres}*! Tu cita ha sido agendada y confirmada con éxito.\n\n` +
        `Te esperamos con gusto en la barbería en la fecha elegida. Si necesitas algo más, escribe *hola* para ver el menú principal.`
      );
    } catch (error) {
      console.error("Error al crear cita:", error);
      session.estadoActual = BotState.INICIO;
      session.datosTemporales = {};
      return "❌ Ocurrió un error inesperado al procesar tu reservación en nuestro sistema. Por favor escribe *menú* para intentarlo nuevamente.";
    }
  }

  if (inputLower === "no") {
    sesionesActivas.delete(session.telefono);
    return "❌ Reservación cancelada. Si deseas realizar otra consulta o agendar más adelante, escribe *menú*. ¡Que tengas un excelente día!";
  }

  return "⚠️ Respuesta inválida. Por favor, escribe únicamente *SI* para confirmar la cita, o *NO* para cancelarla:";
}

export const sesionesActivas = new Map<string, UserSession>();
export const FAQ: Record<string, string> = {
  faq_horario: "🕐 Atendemos de Lunes a Viernes de 8am a 6pm.",
  faq_precio: "💰 Nuestros planes inician desde $12.000 COP.",
  faq_ubicacion: "📍 Estamos en Calle 123 #45-67, Bogotá.",
  faq_contacto: "📞 Llámanos al 300-123-4567 o escribe a soporte@miturno.com",
};
