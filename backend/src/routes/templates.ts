import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category_tags: z.array(z.string()).optional(),
  config_json: z.any(),
  is_public: z.boolean().default(false),
});

router.get('/community', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('templates').select('*').eq('is_public', true).order('download_count', { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ templates: data });
  } catch (err) { next(err); }
});

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('templates').select('*').eq('creator_id', req.userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ templates: data });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, description, category_tags, config_json, is_public } = templateSchema.parse(req.body);
    const { data, error } = await supabase.from('templates').insert({
      id: uuidv4(), creator_id: req.userId, name, description, category_tags: category_tags || [], config_json, is_public,
    }).select().single();
    if (error) throw error;
    res.status(201).json({ template: data });
  } catch (err) { next(err); }
});

router.post('/:id/clone', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { data: source, error: fetchError } = await supabase.from('templates').select('*').eq('id', req.params.id).single();
    if (fetchError || !source) throw new Error('Template not found');
    const { data, error } = await supabase.from('trackers').insert({
      id: uuidv4(), user_id: req.userId, name: source.name, config_json: source.config_json,
    }).select().single();
    if (error) throw error;
    await supabase.rpc('increment_template_downloads', { template_id: req.params.id });
    res.status(201).json({ tracker: data });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const template = templateSchema.partial().parse(req.body);
    const { data, error } = await supabase.from('templates').update(template).eq('id', req.params.id).eq('creator_id', req.userId).select().single();
    if (error || !data) throw new Error('Not found');
    res.json({ template: data });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error } = await supabase.from('templates').delete().eq('id', req.params.id).eq('creator_id', req.userId);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;