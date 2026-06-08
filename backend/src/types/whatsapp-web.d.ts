declare module 'whatsapp-web.js' {
  const Client: any;
  const LocalAuth: any;
  export { Client, LocalAuth };
}

declare module 'qrcode-terminal' {
  export function generate(qr: string, options?: { small?: boolean }): void;
}
