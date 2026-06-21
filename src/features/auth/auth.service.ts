import { redisClient } from "../../shared/utils/redis-client.js"
import { encodeBase64Url } from "../../shared/utils/encodeBase64Url.js";
import crypto from "crypto";
import { OauthParamsInput, PKCEPair, RedisSessionInput, Tokens, XTokens } from "../../shared/types/auth.js";
import { createUser } from "../user/user.service.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "../../shared/lib/jwt.js";
import { REDIRECT_URI, X_TOKEN_URL } from "../../shared/const.js";
import { createUserInput } from "../../shared/types/user.js";
import { createXAccount, getXUserDetails } from "../x-account/x-account.service.js";
import { deleteRefreshToken, getRefreshTokenOwner, storeRefreshToken } from "../../shared/lib/redis.js";
import { UnauthorizedError } from "../../shared/lib/errors.js";

export const credentials = btoa(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`);

export function generatePKCE(): PKCEPair {
  const codeVerifier = encodeBase64Url(crypto.randomBytes(32)); // random high entropy string sent to auth server when requesting for access token to be hashed and compared with challenge hash
  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = encodeBase64Url(hash); // hash sent to auth server when making the authorization request to keep and verify with later
  return { codeVerifier, codeChallenge };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function constructParams({ state, codeChallenge, codeVerifier, code }: OauthParamsInput): URLSearchParams {
  const params = new URLSearchParams();
  params.append("response_type", "code");
  params.append("scope", "tweet.write tweet.read users.read users.email offline.access ");
  params.append("state", state ?? generateState());
  params.append("code_challenge", codeChallenge!);
  params.append("code_challenge_method", "S256");
  params.append("grant_type", "authorization_code");
  params.append("client_id", process.env.X_CLIENT_ID || "");
  params.append("redirect_uri", REDIRECT_URI);
  params.append("code", code!);
  params.append("code_verifier", codeVerifier!);
  return params;
}

export async function saveXTokens({ sessionID, tokens }: RedisSessionInput) {
  console.log(tokens);
  try {
    await redisClient.set(
      `session:${sessionID}`,
      JSON.stringify(tokens)
    );
  } catch (error) {
    throw error;
  }
}

export async function getXAccessToken(body: URLSearchParams): Promise<Tokens> {
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

    const { access_token, refresh_token } = (await response.json()) as XTokens;

    const tokens: Tokens = {
      accessToken: access_token,
      refreshToken: refresh_token
    }

    return tokens;
  } catch (error) {
    console.error("Access token error:", error);
    throw error;
  }
}

export function postSuccessMessage(accessToken: string) {
  const message = `
        <html>
          <body>
            <script>
              window.opener.postMessage({ status: "success", accessToken: "${accessToken}" }, "${process.env
      .CLIENT_URL!}");
              window.close();
            </script>
          </body>
        </html>
      `
  return message;
}

export async function verifyRefreshToken(token: string) {
  if (!token) {
    throw new UnauthorizedError("Session expired, please login.");
  }

  const tokenHash = hashToken(token);
  const userId = await getRefreshTokenOwner(tokenHash);

  if (!userId) {
    throw new UnauthorizedError("Session expired, please login.");
  }

  return userId;
}

export async function xTokenRefresh(refreshToken: string, sessionID: string) {
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

    await saveXTokens({ sessionID, tokens });

  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function login(data: createUserInput) {
  try {
    const user = await createUser(data);
    const { accessToken, refreshToken } = await issueTokenPair({ username: user.username, email: user.email, id: user.id, name: user.name });
    return { user, accessToken, refreshToken };
  } catch (err) {
    throw err;
  }
}

export async function handleOAuthCallback(code: string, codeVerifier: string, sessionID: string) {
  const body = constructParams({
    code,
    codeVerifier
  });
  const tokens = await getXAccessToken(body);
  await saveXTokens({ sessionID, tokens });
  const xUser = await getXUserDetails(tokens);
  const { user, accessToken, refreshToken } = await login({ email: xUser.confirmed_email, name: xUser.name, username: xUser.username, id: xUser.id });
  await createXAccount(user.id, tokens);
  return { user, accessToken, refreshToken };
}

export async function logoutUser(rawToken: string): Promise<void> {
  try {
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      const userId = await getRefreshTokenOwner(tokenHash)
      if (userId) await deleteRefreshToken(userId, tokenHash)
    }
  } catch (e) {
  }
}

export async function issueTokenPair({ id, email, name, username }: { id: string, email: string, name: string, username: string }) {
  const accessToken = generateAccessToken({
    id,
    email,
    name,
    username
  })

  const refreshToken = generateRefreshToken()
  const refreshTokenHash = hashToken(refreshToken)

  await storeRefreshToken(id, refreshTokenHash)

  return { accessToken, refreshToken }
}
