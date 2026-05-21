// test-bot.js
process.env.NODE_ENV = "test";
require("dotenv").config({ path: ".env.development" });
const { handleMessage } = require("./src/bot.handler");

async function simular(texto) {
  console.log(`\n👤 Usuario: "${texto}"`);
  const fakeEntry = {
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

async function main() {
  await simular("hola");
  await simular("1");
  await simular("2");
  await simular("ubicacion");
}

main().catch(console.error);
