/// <reference path="../../shared/types/express.d.ts" />
import { Request, Response } from "express";
import {
  constructParams,
  generatePKCE,
  generateState,
  getAccessToken,
  postSuccessMessage,
  saveSessionTokens,
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
  await redisClient.del(`session:${req.sessionID}`);
  return res.status(200).json({ message: "Logged out successfully" });
}
