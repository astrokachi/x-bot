import { generatePKCE, generateState, getAccessToken, } from "./auth.service.js";
import { redisClient } from "../../shared/utils/redis-client.js";
const REDIRECT_URI = `${process.env.APP_URL}/auth/callback`;
export async function authorize(req, res) {
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
export async function getToken(req, res) {
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
    try {
        const { access_token, refresh_token } = await getAccessToken(body);
        const tokens = {
            accessToken: access_token,
            refreshToken: refresh_token,
        };
        req.session.tokens = tokens;
        await redisClient.set(`session:${req.sessionID}`, JSON.stringify(req.session.tokens)
        // { expiration: { type: "EX", value: 10000 } }
        );
        return res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ status: "success" }, "${process.env
            .CLIENT_URL}");
              window.close();
            </script>
          </body>
        </html>
      `);
    }
    catch (error) {
        let message = "Internal Server Error";
        if (error instanceof Error) {
            message = error.message;
        }
        return res.status(500).json({ message });
    }
}
export async function logout(req, res) {
    try {
        await redisClient.del(`session:${req.sessionID}`);
        return res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        let message = "Internal Server Error";
        if (error instanceof Error) {
            message = error.message;
        }
        return res.status(500).json({ message });
    }
}
