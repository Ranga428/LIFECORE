import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const eventSchema = z.object({
  title: z.string().min(1),
  start_at: z.string().datetime(),
  end_at: z.string().datetime().optional(),
  recurrence_rule: z.string().optional(),
  google_event_id: z.string().optional(),
  timer_enabled: z.boolean().default(true),
});

router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { start, end } = req.query;
    
    let query = supabase
      .from('events')
      .select('*')
      .eq('user_id', req.userId)
      .order('start_at', { ascending: true });

    if (start) {
      query = query.gte('start_at', start as string);
    }
    if (end) {
      query = query.lte('start_at', end as string);
    }

    const { data: events, error } = await query;

    if (error) throw error;
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !event) {
      throw new AppError(404, 'Event not found');
    }

    res.json({ event });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { title, start_at, end_at, recurrence_rule, google_event_id, timer_enabled } = eventSchema.parse(req.body);
    const id = uuidv4();

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        id,
        user_id: req.userId,
        title,
        start_at,
        end_at,
        recurrence_rule,
        google_event_id,
        timer_enabled,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { title, start_at, end_at, recurrence_rule, timer_enabled } = eventSchema.partial().parse(req.body);

    const { data: event, error } = await supabase
      .from('events')
      .update({ title, start_at, end_at, recurrence_rule, timer_enabled })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error || !event) {
      throw new AppError(404, 'Event not found');
    }

    res.json({ event });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) throw error;

    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;