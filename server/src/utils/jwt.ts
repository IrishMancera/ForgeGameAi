import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export function refreshToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, config.jwtSecret, { expiresIn: '30d' });
}
