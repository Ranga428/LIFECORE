import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const trackerSchema = z.object({
  name: z.string().min(1),
  prompt_used: z.string().optional(),
  config_json: z.any().optional(),
});

const sectionSchema = z.object({
  tracker_id: z.string().uuid(),
  type: z.enum(['fitness', 'nutrition', 'finance', 'schedule', 'medicine', 'wellness', 'productivity', 'custom']),
  order_index: z.number().int().min(0),
  config_json: z.any(),
});

router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { data: trackers, error } = await supabase
      .from('trackers')
      .select('*, tracker_sections(*)')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ trackers });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const { data: tracker, error } = await supabase
      .from('trackers')
      .select('*, tracker_sections(*)')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !tracker) {
      throw new AppError(404, 'Tracker not found');
    }

    res.json({ tracker });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, prompt_used, config_json } = trackerSchema.parse(req.body);
    const id = uuidv4();

    const { data: tracker, error } = await supabase
      .from('trackers')
      .insert({
        id,
        user_id: req.userId,
        name,
        prompt_used,
        config_json,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ tracker });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { name, config_json } = trackerSchema.partial().parse(req.body);

    const { data: tracker, error } = await supabase
      .from('trackers')
      .update({ name, config_json, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error || !tracker) {
      throw new AppError(404, 'Tracker not found');
    }

    res.json({ tracker });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('trackers')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;

    res.json({ message: 'Tracker deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/sections', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { type, order_index, config_json } = sectionSchema.parse(req.body);

    const { data: tracker, error: trackerError } = await supabase
      .from('trackers')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (trackerError || !tracker) {
      throw new AppError(404, 'Tracker not found');
    }

    const sectionId = uuidv4();
    const { data: section, error } = await supabase
      .from('tracker_sections')
      .insert({
        id: sectionId,
        tracker_id: id,
        type,
        order_index,
        config_json,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ section });
  } catch (err) {
    next(err);
  }
});

export default router;