FROM node:20-slim

# Instalar dependencias necesarias para Puppeteer y Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Evitar descargar Chromium integrado de Puppeteer, usar el del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copiar archivos de dependencias e instalar todas (incluyendo dev para compilar y ejecutar tsx)
COPY package*.json ./
RUN npm install

# Copiar el resto del código y compilar a JS
COPY . .
RUN npm run build

# Exponer el puerto del backend
EXPOSE 3000

# El entrypoint aplica migraciones pendientes antes de arrancar (dev y prod).
# Se invoca con "sh" para no depender del bit de ejecución (relevante con el
# bind-mount de ./backend en desarrollo).
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]

# Iniciar la aplicación en modo desarrollo por defecto (sobrescribible en docker-compose.prod.yml)
CMD ["npm", "run", "dev"]
