import { createClient, RedisClientType } from "redis";

const host = process.env.REDIS_HOST || "localhost";
const port = Number(process.env.REDIS_PORT) || 6379;
const password = process.env.REDIS_PASSWORD || undefined;

export const redisClient: RedisClientType = createClient({
  socket: { host, port },
  password,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

redisClient.on("connect", () => {
  console.log(`✅ Redis conectado en ${host}:${port}`);
});

let connectPromise: Promise<void> | null = null;

export function connectRedis(): Promise<void> {
  if (redisClient.isOpen) return Promise.resolve();
  if (!connectPromise) {
    connectPromise = redisClient
      .connect()
      .then(() => undefined)
      .catch((err) => {
        connectPromise = null;
        throw err;
      });
  }
  return connectPromise;
}
