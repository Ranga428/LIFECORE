import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const workoutSchema = z.object({
  plan_json: z.any(),
  generated_prompt: z.string(),
  week_number: z.number().int().min(1),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
});

const workoutLogSchema = z.object({
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*, workout_logs(*)')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ workouts });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { data: workout, error } = await supabase
      .from('workouts')
      .select('*, workout_logs(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !workout) {
      throw new AppError(404, 'Workout not found');
    }

    res.json({ workout });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { plan_json, generated_prompt, week_number, status } = workoutSchema.parse(req.body);
    const id = uuidv4();

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({ id, user_id: req.userId, plan_json, generated_prompt, week_number, status })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ workout });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { error } = await supabase.from('workouts').delete().eq('id', req.params.id).eq('user_id', req.userId);
    if (error) throw error;
    res.json({ message: 'Workout deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/log', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { notes, rating } = workoutLogSchema.parse(req.body);
    const id = uuidv4();

    const { data: log, error } = await supabase
      .from('workout_logs')
      .insert({ id, workout_id: req.params.id, user_id: req.userId, notes, rating, completed_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ log });
  } catch (err) {
    next(err);
  }
});

export default router;