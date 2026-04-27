import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createUserClient } from '../lib/supabase.js';

const router = express.Router();

// GET /api/sessions — list user's sessions
router.get('/', requireAuth, async (req, res) => {
  const supabase = createUserClient(req.token);
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/sessions/:id — get session + questions
router.get('/:id', requireAuth, async (req, res) => {
  const supabase = createUserClient(req.token);
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*, questions(*)')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// DELETE /api/sessions/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const supabase = createUserClient(req.token);
  const { error } = await supabase.from('sessions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
