import { prisma } from "../../shared/lib/prisma.js";
import { Tokens } from "../../shared/types/auth.js";

export async function createXAccount(user_id: string, tokens: Tokens) { // Use upsert to handle case where X account already exists

  await prisma.xAccount.upsert({
    where: { user_id },
    update: {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_expires_at: (Date.now() + (2 * 60 * 60)).toString(), // Reset expiry, will be set when token is refreshed
    },
    create: {
      user_id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    }
  });
}
