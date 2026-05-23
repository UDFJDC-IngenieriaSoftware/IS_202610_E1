export abstract class BaseWhatsAppService {
  constructor() {
    this.sendText = this.sendText.bind(this);
    this.sendMenu = this.sendMenu.bind(this);
  }

  abstract sendText(to: string, text: string): Promise<any>;
  abstract sendMenu(to: string): Promise<any>;
}
