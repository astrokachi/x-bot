/// <reference path="../../shared/types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import {
  generatePKCE,
  generateState,
  constructParams,
  postSuccessMessage,
  register as registerUser,
  login as loginUser,
  logoutUser,
  handleOAuthCallback,
} from "./auth.service.js";
import { redisClient } from "../../shared/utils/redis-client.js";
import { sendResponse } from "../../shared/utils/response.js";


export async function authorize(req: Request, res: Response) {
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
export async function getToken(req: Request, res: Response) {
  const { code } = req.query;
  const {
    codeVerifier,
    // userId 
  } = req.session;
  const token = await handleOAuthCallback(code as string, codeVerifier as string, req.sessionID);
  res.send(postSuccessMessage(token));
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

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await registerUser(req.body);
    sendResponse(res, 201, "Registration successful", { user, token });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await loginUser(req.body);
    sendResponse(res, 200, "Login successful", { user, token });
  } catch (error) {
    next(error);
  }
}
