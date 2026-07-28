import { v4 as uuid } from 'uuid';
import { getDatabase } from '../models/schema.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken, refreshToken } from '../utils/jwt.js';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  subscriptionPlan: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export async function registerUser(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<AuthResponse> {
  const db = getDatabase();
  const userId = uuid();
  const passwordHash = await hashPassword(password);

  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    throw new Error('Email already registered');
  }

  await db.run(
    `INSERT INTO users (id, email, passwordHash, firstName, lastName, subscriptionPlan, role)
     VALUES (?, ?, ?, ?, ?, 'free', 'viewer')`,
    [userId, email, passwordHash, firstName || null, lastName || null]
  );

  const user = await getUserById(userId);
  if (!user) throw new Error('Failed to create user');

  const token = generateToken(userId, email);
  const refresh = refreshToken(userId, email);

  return { user, token, refreshToken: refresh };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const db = getDatabase();

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const passwordMatch = await verifyPassword(password, user.passwordHash);
  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user.id, email);
  const refresh = refreshToken(user.id, email);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      subscriptionPlan: user.subscriptionPlan,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
    refreshToken: refresh,
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  const db = getDatabase();

  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    subscriptionPlan: user.subscriptionPlan,
    role: user.role,
    createdAt: user.createdAt,
  };
}
