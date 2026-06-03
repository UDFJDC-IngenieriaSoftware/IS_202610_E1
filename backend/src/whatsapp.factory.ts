import { env } from "./config/env";
import { BaseWhatsAppService } from "./whatsapp.interface";
import { WhatsAppMockService } from "./whatsapp-mock.service";
import { WhatsAppLocalService } from "./whatsapp-local.service";

function getWhatsAppServiceInstance(): BaseWhatsAppService {
  if (
    env.nodeEnv === "test" ||
    (env.nodeEnv === "development" && !env.enableWhatsappLocal)
  ) {
    console.log("WhatsApp adapter: mock service");
    return new WhatsAppMockService();
  }

  console.log("WhatsApp adapter: local whatsapp-web.js client");
  return new WhatsAppLocalService();
}

const whatsappService = getWhatsAppServiceInstance();
export default whatsappService;
