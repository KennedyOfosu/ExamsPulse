import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODE_INSTRUCTIONS = {
  mcq: 'Generate ONLY multiple choice questions with 4 options (A, B, C, D).',
  essay: 'Generate ONLY essay questions requiring detailed written responses.',
  short_answer: 'Generate ONLY short-answer questions requiring concise, specific responses.',
  mixed: 'Generate a balanced mix: roughly 30% MCQ, 20% short-answer, 20% essay, and 30% coding questions.',
  code: 'Generate ONLY coding questions requiring students to write code snippets.',
};

export const generateQuestions = async ({ text, courseName, mode, count = 10 }) => {
  const systemPrompt = `You are an expert academic exam question generator.
Create high-quality exam questions that test deep understanding, not just memorization.
CRITICAL: Return ONLY a valid JSON array. No markdown code fences, no explanation, no preamble. Just the raw JSON array.`;

  const userPrompt = `Course: ${courseName}
Mode: ${MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.mixed}
Generate exactly ${count} exam questions from the study material below.

STUDY MATERIAL:
${text.substring(0, 6000)}

Return ONLY a JSON array (no markdown, no \`\`\`json fences) with this exact structure:
[
  {
    "type": "mcq",
    "question": "Full question text?",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "answer": "A",
    "explanation": "Why A is correct."
  },
  {
    "type": "short_answer",
    "question": "Full question text?",
    "options": null,
    "answer": "The model answer.",
    "explanation": null
  },
  {
    "type": "essay",
    "question": "Full question text?",
    "options": null,
    "answer": "A detailed model answer.",
    "explanation": null
  },
  {
    "type": "code",
    "question": "Write a function that...",
    "options": null,
    "answer": "function example() { ... }",
    "explanation": "Explanation of the code logic."
  }
]`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 8192,
  });

  const raw = response.choices[0]?.message?.content?.trim() || '';
  // Strip markdown fences if the model adds them
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    const questions = JSON.parse(cleaned);
    if (!Array.isArray(questions)) throw new Error('Response is not an array');
    return questions;
  } catch {
    console.error('Raw Groq response:', raw);
    throw new Error('AI returned invalid JSON. Please try again.');
  }
};
