import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const nutritionLogSchema = z.object({
  logged_at: z.string().datetime().optional(),
  items_json: z.array(z.object({
    name: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
  })),
  source: z.enum(['manual', 'photo', 'search']).default('manual'),
});

const groceryListSchema = z.object({
  name: z.string().min(1),
  items_json: z.array(z.object({
    name: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    checked: z.boolean().optional(),
  })).optional(),
});

router.get('/logs', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { start, end } = req.query;
    let query = supabase.from('nutrition_logs').select('*').eq('user_id', req.userId);
    if (start) query = query.gte('logged_at', start as string);
    if (end) query = query.lte('logged_at', end as string);
    const { data, error } = await query.order('logged_at', { ascending: false });
    if (error) throw error;
    res.json({ logs: data });
  } catch (err) { next(err); }
});

router.post('/logs', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { items_json, source } = nutritionLogSchema.parse(req.body);
    const { data, error } = await supabase.from('nutrition_logs').insert({
      id: uuidv4(), user_id: req.userId, items_json, source,
      logged_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    res.status(201).json({ log: data });
  } catch (err) { next(err); }
});

router.get('/grocery', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('grocery_lists').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ lists: data });
  } catch (err) { next(err); }
});

router.post('/grocery', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, items_json } = groceryListSchema.parse(req.body);
    const { data, error } = await supabase.from('grocery_lists').insert({
      id: uuidv4(), user_id: req.userId, name, items_json: items_json || [],
    }).select().single();
    if (error) throw error;
    res.status(201).json({ list: data });
  } catch (err) { next(err); }
});

router.put('/grocery/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const items = groceryListSchema.shape.items_json.parse(req.body.items_json);
    const { data, error } = await supabase.from('grocery_lists').update({ items_json: items }).eq('id', req.params.id).eq('user_id', req.userId).select().single();
    if (error || !data) throw new Error('Not found');
    res.json({ list: data });
  } catch (err) { next(err); }
});

router.delete('/grocery/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error } = await supabase.from('grocery_lists').delete().eq('id', req.params.id).eq('user_id', req.userId);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;