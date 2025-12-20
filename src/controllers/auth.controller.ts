/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import { generatePKCE, generateState, getAccessToken } from "../services/x-auth.service";

const REDIRECT_URI = "http://localhost:3002/auth/callback";

export async function authorize(req: Request, res: Response) {
  const { codeVerifier, codeChallenge } = generatePKCE();
  req.session.codeVerifier = codeVerifier;

  const params = new URLSearchParams();
  params.append("response_type", "code");
  params.append("client_id", process.env.X_CLIENT_ID || "");
  params.append("redirect_uri", REDIRECT_URI);
  params.append("scope", "tweet.write tweet.read users.read offline.access");
  params.append("state", generateState());
  params.append("code_challenge", codeChallenge);
  params.append("code_challenge_method", "S256");

  return res.redirect(`https://twitter.com/i/oauth2/authorize?${params.toString()}`);
}

export async function getToken(req: Request, res: Response) {
  const { code } = req.query;

  if (!code || !req.session.codeVerifier) {
    return res.status(400).send({ err: "Missing code or PKCE verifier." });
  }

  const body = new URLSearchParams();
  body.append("grant_type", "authorization_code");
  body.append("client_id", `${process.env.X_CLIENT_ID}`);
  body.append("redirect_uri", REDIRECT_URI);
  body.append("code", `${code}`);
  body.append("code_verifier", req.session.codeVerifier);

  const { access_token, refresh_token } = await getAccessToken(body);

  req.session.accessToken = access_token;
  req.session.refreshToken = refresh_token;
  return res.send({ msg: "Access granted" });
}