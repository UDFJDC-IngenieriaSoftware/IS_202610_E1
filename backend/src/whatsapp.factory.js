// src/whatsapp.factory.js
const env = process.env.NODE_ENV || "development";

function getWhatsAppServiceInstance() {
  if (env === "test") {
    console.log("🏭 Fábrica: Instanciando Mock Service (pruebas offline)");
    const WhatsAppMockService = require("./whatsapp-mock.service");
    return new WhatsAppMockService();
  }
  
  if (env === "production") {
    console.log("🏭 Fábrica: Instanciando Meta Business API Service (producción)");
    const WhatsAppCloudService = require("./whatsapp.service");
    return new WhatsAppCloudService();
  }

  console.log("🏭 Fábrica: Instanciando whatsapp-web.js Service (desarrollo)");
  const WhatsAppLocalService = require("./whatsapp-local.service");
  return new WhatsAppLocalService();
}

// Exporta una única instancia única (Singleton) del servicio correspondiente
module.exports = getWhatsAppServiceInstance();
