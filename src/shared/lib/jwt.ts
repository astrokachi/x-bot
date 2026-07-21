import jwt from 'jsonwebtoken';
// import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { AuthenticationError, UnauthorizedError } from './errors.js';

const { ACCESS_TOKEN_SECRET } = process.env;

export type UserDetails = { id: string; email: string; name: string; username: string, profile_img_url: string | null }

if (!ACCESS_TOKEN_SECRET) throw new Error('ACCESS_TOKEN_SECRET is not set');

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7; export interface TokenPayload {
  user_id: string;
  email: string;
  name: string;
  username: string;
  profile_img_url: string;
  exp?: number;
  iat?: number;
}

export const generateAccessToken = (user: UserDetails): string => {
  const payload: TokenPayload = {
    user_id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    profile_img_url: user.profile_img_url!
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    throw new UnauthorizedError('Invalid token');
  }
};

export const generateRefreshToken = () =>
  crypto.randomBytes(40).toString('hex');

export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');


