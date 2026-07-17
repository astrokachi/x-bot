/// <reference path="../../shared/types/express.d.ts" />
import { CookieOptions, Request, Response } from "express";
import {
  generatePKCE,
  generateState,
  constructParams,
  // logoutUser,
  handleOAuthCallback,
  verifyRefreshToken,
  logoutUser,
  issueTokenPair,
} from "./auth.service.js";
import { redisClient } from "../../shared/utils/redis-client.js";
import { sendResponse } from "../../shared/utils/response.js";
import { generateAccessToken, REFRESH_TOKEN_TTL } from "../../shared/lib/jwt.js";
import { getUserProfile } from "../user/user.service.js";
import { AuthenticationError } from "../../shared/lib/errors.js";

// PKCE verifier is stored in Redis keyed by `state` so it survives the
// cross-site X → app redirect (a session cookie may not).
const oauthKey = (state: string) => `oauth:${state}`;
const OAUTH_TTL = 600; // 10 minutes

const COOKIE_NAME = 'refresh_token';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: REFRESH_TOKEN_TTL * 1000,
  path: '/auth/refresh',
}

export async function redirectToTwitterAuth(_req: Request, res: Response) {
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = generateState();

  // Keyed by state so the callback can recover it after the X redirect.
  await redisClient.set(oauthKey(state), codeVerifier, { EX: OAUTH_TTL });

  const params = constructParams({ state, codeChallenge });
  return res.redirect(
    `https://twitter.com/i/oauth2/authorize?${params.toString()}`
  );
}

// get tokens (oauth flow)
export async function OAuthCallback(req: Request, res: Response) {
  try {
    const { code, state, error } = req.query;

    // User cancelled the OAuth on X — redirect to login cleanly.
    if (error) {
      return res.redirect(`${process.env.CLIENT_URL!}/login`);
    }

    if (!state || typeof state !== "string") {
      throw new AuthenticationError("Missing OAuth state");
    }

    const codeVerifier = await redisClient.get(oauthKey(state));
    if (!codeVerifier) {
      throw new AuthenticationError("Login session expired. Please try again.");
    }
    // Single-use: consume it so the code can't be replayed.
    await redisClient.del(oauthKey(state));

    const user = await handleOAuthCallback(code as string, codeVerifier, req.sessionID);
    const { refreshToken } = await issueTokenPair(user);

    res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    return res.redirect(`${process.env.CLIENT_URL!}/`);
  } catch (error: any) {
    const message = error?.message || "Authentication failed";
    return res.redirect(
      `${process.env.CLIENT_URL!}/login?error=${encodeURIComponent(message)}`,
    );
  }
}

export async function refreshAccessToken(req: Request, res: Response) {
  const refreshToken = req.cookies?.[COOKIE_NAME];
  const userId = await verifyRefreshToken(refreshToken);
  const userProfile = await getUserProfile(userId);
  const accessToken = generateAccessToken({ ...userProfile, id: userId });

  return sendResponse(res, 200, "Access token issued successfully", accessToken);
}

export async function logout(req: Request, res: Response) {
  // Handle X session logout
  if (req.sessionID) {
    await redisClient.del(`session:${req.sessionID}`);
  }
  const rawToken = req.cookies?.[COOKIE_NAME]
  await logoutUser(rawToken);

  res.clearCookie(COOKIE_NAME);

  return sendResponse(res, 200, "Logged out successfully", null);
}
