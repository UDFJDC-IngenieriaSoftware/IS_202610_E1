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

# Copiar archivos de dependencias e instalar
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Exponer el puerto del backend
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "start"]
