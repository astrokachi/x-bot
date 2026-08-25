import {
  Client,
  OAuth2,
  generateCodeVerifier,
  generateCodeChallenge,
  type ClientConfig,
  type OAuth2Config,
  type OAuth2Token,
} from "@xdevplatform/xdk";
import { REDIRECT_URI } from "../const.js";

const SCOPE = ["tweet.write", "tweet.read", "users.read", "users.email", "media.write", "offline.access"] as const;

let oAuth2Instance: OAuth2 | null = null;

function getOAuth2Config(): OAuth2Config {
  return {
    clientId: process.env.X_CLIENT_ID!,
    clientSecret: process.env.X_CLIENT_SECRET!,
    redirectUri: REDIRECT_URI,
    scope: [...SCOPE],
  };
}

export function createBearerClient(): Client {
  const config: ClientConfig = { bearerToken: process.env.X_BEARER_TOKEN! };
  return new Client(config);
}

export function createOAuth2Client(accessToken: string): Client {
  const config: ClientConfig = { accessToken };
  return new Client(config);
}

export function getOAuth2Helper(): OAuth2 {
  if (!oAuth2Instance) {
    oAuth2Instance = new OAuth2(getOAuth2Config());
  }
  return oAuth2Instance;
}

export { generateCodeVerifier, generateCodeChallenge };
export type { OAuth2Token };
