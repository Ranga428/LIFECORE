import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const audioNoteSchema = z.object({
  audio_url: z.string().url(),
  transcript: z.string().optional(),
  tags_json: z.array(z.string()).optional(),
});

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('audio_notes').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ notes: data });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { audio_url, transcript, tags_json } = audioNoteSchema.parse(req.body);
    const { data, error } = await supabase.from('audio_notes').insert({
      id: uuidv4(), user_id: req.userId, audio_url, transcript, tags_json: tags_json || [],
    }).select().single();
    if (error) throw error;
    res.status(201).json({ note: data });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { transcript, tags_json } = audioNoteSchema.partial().parse(req.body);
    const { data, error } = await supabase.from('audio_notes').update({ transcript, tags_json }).eq('id', req.params.id).eq('user_id', req.userId).select().single();
    if (error || !data) throw new Error('Not found');
    res.json({ note: data });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error } = await supabase.from('audio_notes').delete().eq('id', req.params.id).eq('user_id', req.userId);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;