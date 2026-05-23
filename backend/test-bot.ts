process.env.NODE_ENV = "test";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

import { handleMessage, WebhookEntry } from "./src/controllers/bot.controller";

async function simular(texto: string): Promise<void> {
  console.log(`\n👤 Usuario: "${texto}"`);
  const fakeEntry: WebhookEntry = {
    changes: [
      {
        value: {
          messages: [
            {
              from: "573046519766", // celular simulado
              type: "text",
              text: { body: texto },
            },
          ],
        },
      },
    ],
  };
  await handleMessage(fakeEntry);
}

async function main(): Promise<void> {
  console.log("🚀 --- INICIANDO SIMULACIÓN DE FLUJO COMPLETO DE AGENDAMIENTO --- 🚀");
  
  await simular("hola");                  // Ver el menú
  await simular("3");                     // Elegir "Agendar Cita"
  await simular("1");                     // Seleccionar servicio "Corte Premium" (Juan Pérez)
  await simular("1");                     // Seleccionar el primer horario disponible (09:00 AM)
  await simular("Andrés");                // Ingresar Nombre
  await simular("Ramírez");               // Ingresar Apellido
  await simular("SI");                    // Confirmar Reserva
}

main().catch(console.error);
