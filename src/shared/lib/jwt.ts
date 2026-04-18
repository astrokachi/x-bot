import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const SECRET_KEY = process.env.JWT_SECRET || 'hmm';
const EXPIRES_IN = '7d';

export interface TokenPayload {
  user_id: string;
  email: string;
  name: string;
  username: string;
  jti: string; // Unique identifier for the token (for single-session)
  exp?: number;
  iat?: number;
}

export const signToken = (user: { id: string; email: string; name: string; username: string }): string => {
  const jti = uuidv4();
  const payload: TokenPayload = {
    user_id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    jti,
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, SECRET_KEY) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};
