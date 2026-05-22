process.env.NODE_ENV = "test";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

import { handleMessage, WebhookEntry } from "./src/bot.controller";

async function simular(texto: string): Promise<void> {
  console.log(`\n👤 Usuario: "${texto}"`);
  const fakeEntry: WebhookEntry = {
    changes: [
      {
        value: {
          messages: [
            {
              from: "573046519766", // tu segunda SIM
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
  await simular("hola");
  await simular("1");
  await simular("2");
  await simular("ubicacion");
}

main().catch(console.error);
