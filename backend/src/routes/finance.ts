import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const financeEntrySchema = z.object({
  category: z.string().min(1),
  amount: z.number(),
  type: z.enum(['income', 'expense']),
  date: z.string(),
  notes: z.string().optional(),
});

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { start, end } = req.query;
    let query = supabase.from('finance_entries').select('*').eq('user_id', req.userId);
    if (start) query = query.gte('date', start as string);
    if (end) query = query.lte('date', end as string);
    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    res.json({ entries: data });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { category, amount, type, date, notes } = financeEntrySchema.parse(req.body);
    const { data, error } = await supabase.from('finance_entries').insert({
      id: uuidv4(), user_id: req.userId, category, amount, type, date, notes,
    }).select().single();
    if (error) throw error;
    res.status(201).json({ entry: data });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error } = await supabase.from('finance_entries').delete().eq('id', req.params.id).eq('user_id', req.userId);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;