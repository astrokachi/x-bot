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

const COOKIE_NAME = 'refresh_token';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: REFRESH_TOKEN_TTL * 1000,
  path: '/auth/refresh',
}

export async function redirectToTwitterAuth(req: Request, res: Response) {
  const { codeVerifier, codeChallenge } = generatePKCE();
  req.session.codeVerifier = codeVerifier;
  // Store user_id in session so we can retrieve it in the callback
  // req.session.userId = req.user!.user_id;
  const state = generateState();
  const params = constructParams({ state, codeChallenge });
  return res.redirect(
    `https://twitter.com/i/oauth2/authorize?${params.toString()}`
  );
}

// get tokens (oauth flow) 
export async function OAuthCallback(req: Request, res: Response) {
  const { code } = req.query;
  const {
    codeVerifier,
    // userId 
  } = req.session;
  const user = await handleOAuthCallback(code as string, codeVerifier as string, req.sessionID);
  const { refreshToken } = await issueTokenPair(user);

  res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
  res.redirect(`${process.env.CLIENT_URL!}/`)
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
