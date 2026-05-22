// src/whatsapp.interface.js

class BaseWhatsAppService {
  constructor() {
    this.sendText = this.sendText.bind(this);
    this.sendMenu = this.sendMenu.bind(this);
    this.getServices = this.getServices.bind(this);
  }
  /**
   * Envia un mensaje de texto simple.
   * @param {string} to - Identificador del destinatario (número telefónico)
   * @param {string} text - Contenido del mensaje
   * @returns {Promise<any>}
   */
  async sendText(to, text) {
    throw new Error("Método 'sendText' debe ser implementado.");
  }

  /**
   * Envia un menú interactivo con las opciones del asistente.
   * @param {string} to - Identificador del destinatario
   * @returns {Promise<any>}
   */
  async sendMenu(to) {
    throw new Error("Método 'sendMenu' debe ser implementado.");
  }

  /**
   * Envia la lista de servicios disponibles como mensaje formateado.
   * @param {string} to - Identificador del destinatario
   * @returns {Promise<any>}
   */
  async getServices(to) {
    throw new Error("Método 'getServices' debe ser implementado.");
  }
}

module.exports = BaseWhatsAppService;
