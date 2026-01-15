import { redisClient } from "../../shared/utils/redis-client";
import { encodeBase64Url } from "../../shared/utils/encodeBase64Url";
import crypto from "crypto";

export const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";

export const credentials = btoa(
  `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
);

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

export function generatePKCE(): PKCEPair {
  const codeVerifier = encodeBase64Url(crypto.randomBytes(32)); // random high entropy string sent to auth server when requesting for access token to be hashed and compared with challenge hash
  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = encodeBase64Url(hash); // hash sent to auth server when making the authorization request to keep and verify with later
  return { codeVerifier, codeChallenge };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function getAccessToken(body: URLSearchParams) {
  if (!process.env.X_CLIENT_ID || !process.env.X_CLIENT_SECRET) {
    throw new Error(`Client id or client secret missing`);
  }

  try {
    const response = await fetch(X_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Token error:", errorData);
      throw new Error(`Token request failed: ${JSON.stringify(errorData)}`);
    }

    const tokens = await response.json();
    return tokens;
  } catch (error) {
    console.error("Access token error:", error);
    throw error;
  }
}

export async function tokenRefresh(refreshToken: string, sessionID: string) {
  const body = new URLSearchParams();
  body.append("refresh_token", refreshToken);
  body.append("grant_type", "refresh_token");
  body.append("client_id", process.env.X_CLIENT_ID!);

  try {
    const response = await fetch(X_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body,
    });
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }
    const data = (await response.json()) as { access_token: string };
    const tokens = {
      refreshToken,
      accessToken: data.access_token,
    };
    await redisClient.set(
      `session:${sessionID}`,
      JSON.stringify(tokens)
      // { expiration: { type: "EX", value: 10000 } }
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}
