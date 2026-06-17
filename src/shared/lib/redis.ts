import { redisClient } from "../utils/redis-client.js";
import { REFRESH_TOKEN_TTL } from "./jwt.js";

const rtKey = (rtHash: string) => `rtKey:${rtHash}`;
const rtUserkey = (userId: string) => `rtUser:${userId}`;

export const storeRefreshToken = async (rtHash: string, userId: string) => {
  await redisClient
    .multi()
    .setEx(rtKey(rtHash), REFRESH_TOKEN_TTL, String(userId))
    .sAdd(rtUserkey(userId), rtHash)
    .expire(rtUserkey(userId), REFRESH_TOKEN_TTL)
    .exec()
}

export const getRefreshTokenOwner = async (userId: string) => {
  return await redisClient.get(rtKey(userId));
}

export const getRefreshToken = async (tokenHash: string) => {
  return await redisClient.get(tokenHash);
}

export const deleteRefreshToken = async (tokenHash: string, userId: string) => {
  redisClient
    .multi()
    .del(rtKey(tokenHash))
    .sRem(rtUserkey(userId), tokenHash)
    .exec()
}

export const deleteAllRefreshTokens = async (userId: string) => {
  const hashes = await redisClient.sMembers(rtUserkey(userId));
  if (!hashes?.length) return;

  const pipeline = redisClient.multi();
  hashes.forEach((hash: string) => pipeline.del(rtKey(hash)))
  pipeline.del(rtUserkey(userId));
  await pipeline.exec();
}
