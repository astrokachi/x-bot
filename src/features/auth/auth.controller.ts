/// <reference path="../../shared/types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import {
  constructParams,
  generatePKCE,
  generateState,
  getAccessToken,
  postSuccessMessage,
  saveSessionTokens,
  register as registerUser,
  login as loginUser,
  logoutUser,
} from "./auth.service.js";
import { redisClient } from "../../shared/utils/redis-client.js";


export async function authorize(req: Request, res: Response) {
  const { codeVerifier, codeChallenge } = generatePKCE();
  req.session.codeVerifier = codeVerifier;
  const state = generateState();
  const params = constructParams({ state, codeChallenge });
  return res.redirect(
    `https://twitter.com/i/oauth2/authorize?${params.toString()}`
  );
}

export async function getToken(req: Request, res: Response) {
  const { code } = req.query;
  const { codeVerifier } = req.session;

  const body = constructParams({
    code: code as string,
    codeVerifier: codeVerifier as string
  });
  const tokens = await getAccessToken(body);
  await saveSessionTokens({ sessionID: req.sessionID, tokens });
  return res.send(postSuccessMessage());
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

  return res.status(200).json({ message: "Logged out successfully" });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await registerUser(req.body);
    return res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await loginUser(req.body);
    return res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
}
