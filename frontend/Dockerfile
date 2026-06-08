# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# VITE_ vars are baked into the bundle at build time — must be set here
ARG VITE_API_URL=/api
ARG VITE_USE_MOCKS=false
ARG VITE_TODAY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS
ENV VITE_TODAY=$VITE_TODAY

RUN pnpm build

# ── Stage 2: Serve static files via nginx ───────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
