import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const medicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string(),
  frequency_cron: z.string(),
  start_date: z.string(),
  end_date: z.string().optional(),
});

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('medicine_schedules').select('*').eq('user_id', req.userId);
    if (error) throw error;
    res.json({ schedules: data });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, dosage, frequency_cron, start_date, end_date } = medicineSchema.parse(req.body);
    const { data, error } = await supabase.from('medicine_schedules').insert({
      id: uuidv4(), user_id: req.userId, name, dosage, frequency_cron, start_date, end_date,
    }).select().single();
    if (error) throw error;
    res.status(201).json({ schedule: data });
  } catch (err) { next(err); }
});

router.post('/:id/log', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const status = z.enum(['taken', 'skipped', 'delayed']).parse(req.body.status);
    const { data, error } = await supabase.from('medicine_logs').insert({
      id: uuidv4(), schedule_id: req.params.id, user_id: req.userId, status,
      scheduled_at: new Date().toISOString(), taken_at: status === 'taken' ? new Date().toISOString() : null,
    }).select().single();
    if (error) throw error;
    res.status(201).json({ log: data });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error } = await supabase.from('medicine_schedules').delete().eq('id', req.params.id).eq('user_id', req.userId);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;