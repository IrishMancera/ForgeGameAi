import { Router } from 'express';
import { z } from 'zod';
import { loginUser, registerUser, getUserById, googleUserAuth } from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requestPasswordReset, resetPassword } from "../services/passwordResetService.js";

const forgotPasswordSchema = z.object({ email: z.string().email(), });
const resetPasswordSchema = z.object({ token: z.string(), password: z.string().min(8), });
const googleSchema = z.object({
  idToken: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
});
const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data.email, data.password, data.firstName, data.lastName);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data.email, data.password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const data = googleSchema.parse(req.body);
    const result = await googleUserAuth(data.email, data.displayName, data.photoURL);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Google authentication failed' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch user' });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await requestPasswordReset(email);
    res.json({
      message: "If an account exists, a reset email has been sent."
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid Request",
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    await resetPassword(token, password);

    res.json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Password reset failed.",
    });
  }
});

export default router;
