import { constructParams, generatePKCE, generateState, getAccessToken, postSuccessMessage, saveSessionTokens, } from "./auth.service.js";
import { redisClient } from "../../shared/utils/redis-client.js";
import { getTokenSchema } from "./auth.validation.js";
import { validate } from "../../shared/utils/validate.js";
export async function authorize(req, res) {
    const { codeVerifier, codeChallenge } = generatePKCE();
    req.session.codeVerifier = codeVerifier;
    const state = generateState();
    const params = constructParams({ state, codeChallenge });
    return res.redirect(`https://twitter.com/i/oauth2/authorize?${params.toString()}`);
}
export async function getToken(req, res) {
    const codes = validate(getTokenSchema, {
        code: req.query.code,
        codeVerifier: req.session.codeVerifier
    });
    const body = constructParams(codes);
    const tokens = await getAccessToken(body);
    await saveSessionTokens({ sessionID: req.sessionID, tokens });
    return res.send(postSuccessMessage());
}
export async function logout(req, res) {
    await redisClient.del(`session:${req.sessionID}`);
    return res.status(200).json({ message: "Logged out successfully" });
}
