/// <reference path="../../shared/types/express.d.ts" />
import { Request, Response } from "express";
import {
  generatePKCE,
  generateState,
  constructParams,
  postSuccessMessage,
  logoutUser,
  handleOAuthCallback,
} from "./auth.service.js";
import { redisClient } from "../../shared/utils/redis-client.js";
import { sendResponse } from "../../shared/utils/response.js";
import { REFRESH_TOKEN_TTL } from "../../shared/lib/jwt.js";

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
  const { accessToken, refreshToken } = await handleOAuthCallback(code as string, codeVerifier as string, req.sessionID);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: REFRESH_TOKEN_TTL * 1000,
    path: '/auth/refresh',
  })
  res.send(postSuccessMessage(accessToken));
}

export async function logout(req: Request, res: Response) {
  // Handle X session logout
  if (req.sessionID) {
    await redisClient.del(`session:${req.sessionID}`);
  }

  // Handle JWT logout
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    if (req.user) {
      await logoutUser(token, req.user.user_id);
    }
  }

  return sendResponse(res, 200, "Logged out successfully");
}
