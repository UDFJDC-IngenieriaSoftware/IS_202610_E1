import { env } from "./config/env";
import { BaseWhatsAppService } from "./whatsapp.interface";
import { WhatsAppMockService } from "./whatsapp-mock.service";
import { WhatsAppCloudService } from "./whatsapp.service";
import { WhatsAppLocalService } from "./whatsapp-local.service";

function getWhatsAppServiceInstance(): BaseWhatsAppService {
  if (
    env.nodeEnv === "test" ||
    (env.nodeEnv === "development" && !env.enableWhatsappLocal)
  ) {
    console.log("WhatsApp adapter: mock service");
    return new WhatsAppMockService();
  }

  if (env.nodeEnv === "production") {
    console.log("WhatsApp adapter: Meta Cloud API");
    return new WhatsAppCloudService();
  }

  console.log("WhatsApp adapter: local whatsapp-web.js client");
  return new WhatsAppLocalService();
}

const whatsappService = getWhatsAppServiceInstance();
export default whatsappService;
