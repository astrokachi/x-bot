import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../lib/jwt.js';
import { AuthenticationError, UnauthorizedError } from '../lib/errors.js';
import { redisClient } from '../utils/redis-client.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Check if token is in blacklist (logout)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AuthenticationError('Token revoked');
    }

    // Single-Session Enforcement: Check if this token is the active one
    const activeJti = await redisClient.get(`active_session:${decoded.user_id}`);
    
    // If no active session found or JTI doesn't match, deny access
    if (!activeJti || activeJti !== decoded.jti) {
       throw new UnauthorizedError('Session expired or invalid. Please login again.');
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
