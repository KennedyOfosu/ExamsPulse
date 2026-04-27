import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateQuestions } from '../lib/claude.js';
import { createUserClient } from '../lib/supabase.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { sessionId, count = 10 } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const supabase = createUserClient(req.token);

    // 1. Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (sessionError || !session) return res.status(404).json({ error: 'Session not found' });

    // 2. Get extracted text from ALL documents in this session
    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('extracted_text, filename')
      .eq('session_id', sessionId);
    if (docError || !docs || docs.length === 0) {
      return res.status(404).json({ error: 'No documents found for this session.' });
    }
    const combinedText = docs
      .map(d => `--- ${d.filename} ---\n${d.extracted_text}`)
      .join('\n\n');

    // 3. Generate questions with Groq
    const questions = await generateQuestions({
      text: combinedText,
      courseName: session.course_name,
      mode: session.mode,
      count: Number(count),
    });

    // 4. Save questions to DB
    const rows = questions.map((q) => ({ ...q, session_id: sessionId }));
    const { error: insertError } = await supabase.from('questions').insert(rows);
    if (insertError) throw new Error(insertError.message);

    // 5. Update question count on session
    await supabase
      .from('sessions')
      .update({ question_count: questions.length })
      .eq('id', sessionId);

    res.json({ questions });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
