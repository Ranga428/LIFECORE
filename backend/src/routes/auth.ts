import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { generateToken, generateRefreshToken, AuthRequest, authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res: Response, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const { error } = await supabase.from('users').insert({
      id: userId,
      email,
      name,
      password_hash: passwordHash,
      subscription_tier: 'free',
      theme: 'light',
    });

    if (error) throw error;

    const token = generateToken(userId, email);
    const refreshToken = generateRefreshToken(userId);

    res.status(201).json({
      user: { id: userId, email, name, subscription_tier: 'free', theme: 'light' },
      token,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res: Response, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_tier: user.subscription_tier,
        theme: user.theme,
      },
      token,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, subscription_tier, theme, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res: Response, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, 'Refresh token required');
    }

    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    
    const decoded = jwt.default.verify(refreshToken, JWT_SECRET) as { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      throw new AppError(401, 'Invalid refresh token');
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      throw new AppError(401, 'User not found');
    }

    const newToken = generateToken(decoded.userId, user.email);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;