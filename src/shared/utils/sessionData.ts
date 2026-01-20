import { Tokens } from "../types/auth.js";
import { redisClient } from "./redis-client.js";

export async function getSessionTokens(sessionID: string) {
  const sessionData = await redisClient.get(`session:${sessionID}`);

  if (!sessionData) {
    throw new Error("No session data found.");
  }

  const tokens = JSON.parse(sessionData);

  return tokens as Tokens;
}

