import { prisma } from "../../shared/lib/prisma.js";
import { Tokens, XUser } from "../../shared/types/auth.js";
import { AuthenticationError, NotFoundError } from "../../shared/lib/errors.js";
import { XService } from "../../shared/services/x.service.js";
import logger from "../../shared/utils/logger.js";

// Token expires in 2 hours (in milliseconds)
const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000;

/**
 * Fetches X user details using XService
 */
export async function getXUserDetails(tokens: Tokens): Promise<XUser> {
  try {
    return await XService.getXUserDetails(tokens);
  } catch (err) {
    throw new Error("Failed to fetch X user details");
  }
}

/**
 * Creates or updates an X account for a user
 */
export async function createXAccount(user_id: string, tokens: Tokens) {
  try {
    const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await prisma.xAccount.upsert({
      where: { user_id },
      update: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokenExpiresAt,
      },
      create: {
        user_id,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokenExpiresAt,
      }
    });
  } catch (err) {
    throw new Error("Failed to create/update X account");
  }
}

/**
 * Gets a valid access token for a user, refreshing if expired
 */
export async function getUserAccessToken(userId: string): Promise<string> {
  try {
    const xAccount = await prisma.xAccount.findUnique({
      where: { user_id: userId },
    });

    if (!xAccount) {
      throw new NotFoundError("X account not found for user");
    }

    // Check if token is expired or will expire soon (within 30 minutes)
    const now = new Date();
    const bufferMs = 30 * 60 * 1000; // 30 minute buffer
    const isExpired = xAccount.token_expires_at && xAccount.token_expires_at.getTime() < now.getTime() + bufferMs;

    if (isExpired && xAccount.refresh_token) {
      try {
        // Refresh the token
        const newTokens = await XService.refreshAccessToken(xAccount.refresh_token);
        const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

        // Update the database with new tokens
        await prisma.xAccount.update({
          where: { user_id: userId },
          data: {
            access_token: newTokens.accessToken,
            refresh_token: newTokens.refreshToken,
            token_expires_at: newExpiresAt,
          },
        });

        return newTokens.accessToken;
      } catch (refreshErr: any) {
        logger.error("Error refreshing access token: " + refreshErr.message);
        throw new AuthenticationError("Failed to refresh access token. Please re-authenticate.");
      }
    }

    if (isExpired && !xAccount.refresh_token) {
      throw new AuthenticationError("Token expired and no refresh token available. Please re-authenticate.");
    }

    return xAccount.access_token;
  } catch (err: any) {
    logger.error("Error getting user access token: " + err.message);
    throw new Error("Failed to get user access token");
  }
}
