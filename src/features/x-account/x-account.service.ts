import { eq } from "drizzle-orm";
import { db } from "../../shared/db/index.js";
import { xAccounts } from "../../shared/db/schema.js";
import { Tokens, XUser } from "../../shared/types/auth.js";
import { AuthenticationError, NotFoundError } from "../../shared/lib/errors.js";
import { XService } from "../../shared/services/x.service.js";
import logger from "../../shared/utils/logger.js";

const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000;

export async function getXUserDetails(tokens: Tokens): Promise<XUser> {
  try {
    return await XService.getXUserDetails(tokens);
  } catch (err) {
    throw new Error("Failed to fetch X user details");
  }
}

export async function createXAccount(user_id: string, tokens: Tokens) {
  try {
    const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await db.insert(xAccounts).values({
      userId: user_id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt,
    }).onConflictDoUpdate({
      target: xAccounts.userId,
      set: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt,
      }
    });
  } catch (err) {
    throw new Error("Failed to create/update X account");
  }
}

export async function getUserAccessToken(userId: string): Promise<string> {
  try {
    const [xAccount] = await db.select().from(xAccounts).where(eq(xAccounts.userId, userId));

    if (!xAccount) {
      throw new NotFoundError("X account not found for user");
    }

    const now = new Date();
    const bufferMs = 30 * 60 * 1000;
    const isExpired = xAccount.tokenExpiresAt && xAccount.tokenExpiresAt.getTime() < now.getTime() + bufferMs;

    if (isExpired && xAccount.refreshToken) {
      try {
        const newTokens = await XService.refreshAccessToken(xAccount.refreshToken);
        const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

        await db.update(xAccounts).set({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          tokenExpiresAt: newExpiresAt,
        }).where(eq(xAccounts.userId, userId));

        return newTokens.accessToken;
      } catch (refreshErr: any) {
        logger.error("Error refreshing access token: " + refreshErr.message);
        throw new AuthenticationError("Failed to refresh access token. Please re-authenticate.");
      }
    }

    if (isExpired && !xAccount.refreshToken) {
      throw new AuthenticationError("Token expired and no refresh token available. Please re-authenticate.");
    }

    return xAccount.accessToken;
  } catch (err: any) {
    logger.error("Error getting user access token: " + err.message);
    throw new Error("Failed to get user access token");
  }
}
