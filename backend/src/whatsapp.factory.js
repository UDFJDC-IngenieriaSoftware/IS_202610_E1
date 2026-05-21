// src/whatsapp.factory.js
const env = process.env.NODE_ENV || "development";

function getWhatsAppService() {
  if (env === "production") {
    console.log("🏭 Usando Meta Business API (producción)");
    return require("./whatsapp.service");
  }

  console.log("🏭 Usando whatsapp-web.js (desarrollo)");
  return require("./whatsapp-local.service");
}

module.exports = getWhatsAppService();
