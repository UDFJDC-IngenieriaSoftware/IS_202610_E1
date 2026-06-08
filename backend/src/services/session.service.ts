import { redisClient, connectRedis } from "../config/redis";
import { BotState, UserSession } from "../controllers/bot.types";

const SESSION_TTL_SECONDS = 15 * 60;

function key(telefono: string): string {
  return `session:${telefono}`;
}

export async function getOrCreateSession(telefono: string): Promise<UserSession> {
  await connectRedis();
  const raw = await redisClient.get(key(telefono));
  if (raw) {
    return JSON.parse(raw) as UserSession;
  }
  return {
    telefono,
    estadoActual: BotState.INICIO,
    datosTemporales: {},
  };
}

export async function saveSession(session: UserSession): Promise<void> {
  await connectRedis();
  await redisClient.set(key(session.telefono), JSON.stringify(session), {
    EX: SESSION_TTL_SECONDS,
  });
}

export async function deleteSession(telefono: string): Promise<void> {
  await connectRedis();
  await redisClient.del(key(telefono));
}
