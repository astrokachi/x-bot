import { encodeBase64Url } from '../utils/encodeBase64Url';
import crypto from 'crypto';

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

export function generatePKCE(): PKCEPair {
  const codeVerifier = encodeBase64Url(crypto.randomBytes(32)); // random high entropy string sent to auth server when requesting for access token to be hashed and compared with challenge hash
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = encodeBase64Url(hash); // hash sent to auth server when making the authorization request to keep and verify with later 
  return { codeVerifier, codeChallenge };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}


export async function getAccessToken(body: URLSearchParams) {
  const credentials = btoa(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`);

  try {
    const res = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`
      },
      body,
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Token error:", errorData);
      throw new Error(`Token request failed: ${JSON.stringify(errorData)}`);
    }

    const token = await res.json();
    return token;

  } catch (error) {
    console.error("Access token error:", error);
    throw error;
  }
}