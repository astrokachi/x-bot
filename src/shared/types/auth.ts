export type OauthParamsInput = {
  code?: string;
  codeChallenge?: string;
  codeVerifier?: string;
  state?: string
}

export type PKCEPair = {
  codeVerifier: string;
  codeChallenge: string;
}

export type Tokens = {
  accessToken: string;
  refreshToken: string;
}

export type XTokens = {
  access_token: string;
  refresh_token: string;
}

export type RedisSessionInput = {
  tokens: Tokens;
  sessionID: string;
}

export type XUser = {
  profile_image_url: string;
  confirmed_email: string;
  username: string;
  name: string;
  id: string;
}

export type AuthTokenPayload = {
  sub: string;
}
