import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/grade
 * Body: { question, modelAnswer, studentAnswer }
 * Returns: { score: 'correct'|'partial'|'incorrect', feedback, similarity }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { question, modelAnswer, studentAnswer } = req.body;

    if (!question || !modelAnswer || !studentAnswer?.trim()) {
      return res.status(400).json({ error: 'question, modelAnswer, and studentAnswer are required.' });
    }

    const prompt = `You are an academic grading assistant. Evaluate the student's answer against the model answer.
Be generous and lenient — students often express correct ideas in different words or alternative coding styles.

Question: ${question}

Model Answer: ${modelAnswer}

Student's Answer: ${studentAnswer}

Grade the student's answer and respond with ONLY a valid JSON object (no markdown, no explanation outside the JSON):
{
  "score": "correct" | "partial" | "incorrect",
  "feedback": "Brief, encouraging feedback (1-2 sentences). Acknowledge what they got right.",
  "similarity": 0-100
}

Scoring guide for written/essay:
- "correct": The student's answer captures the main idea(s) correctly. Similarity 70-100.
- "partial": The student got part of it right but missed key points. Similarity 30-69.
- "incorrect": The student's answer is off-topic or wrong. Similarity 0-29.

Scoring guide for CODE:
- "correct": The code logic is sound and solves the problem, even if it has minor syntax typos or different formatting. Similarity 80-100.
- "partial": The approach is correct but has logic errors or is incomplete. Similarity 40-79.
- "incorrect": The code is irrelevant or completely non-functional for the problem. Similarity 0-39.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    const result = JSON.parse(cleaned);
    res.json(result);
  } catch (err) {
    console.error('Grade error:', err);
    res.status(500).json({ error: 'Failed to grade answer. Please try again.' });
  }
});

export default router;
