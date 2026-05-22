import { BaseWhatsAppService } from "./whatsapp.interface";
import { WhatsAppMockService } from "./whatsapp-mock.service";
import { WhatsAppCloudService } from "./whatsapp.service";
import { WhatsAppLocalService } from "./whatsapp-local.service";

const env = process.env.NODE_ENV || "development";

function getWhatsAppServiceInstance(): BaseWhatsAppService {
  if (env === "test") {
    console.log("🏭 Fábrica: Instanciando Mock Service (pruebas offline)");
    return new WhatsAppMockService();
  }

  if (env === "production") {
    console.log(
      "🏭 Fábrica: Instanciando Meta Business API Service (producción)",
    );
    return new WhatsAppCloudService();
  }

  console.log("🏭 Fábrica: Instanciando whatsapp-web.js Service (desarrollo)");
  return new WhatsAppLocalService();
}

// Exporta una única instancia única (Singleton) del servicio correspondiente
const whatsappService = getWhatsAppServiceInstance();
export default whatsappService;
