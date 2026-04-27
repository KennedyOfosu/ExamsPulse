import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { extractText } from '../lib/parser.js';
import { createUserClient } from '../lib/supabase.js';

const router = express.Router();

// Accept up to 10 files, 20 MB each
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
});

router.post('/', requireAuth, upload.array('files', 10), async (req, res) => {
  try {
    const { courseName, mode } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }
    if (!courseName) {
      return res.status(400).json({ error: 'Course name is required.' });
    }

    const supabase = createUserClient(req.token);

    // 1. Create session first
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({ user_id: req.user.id, course_name: courseName.trim(), mode: mode || 'mixed' })
      .select()
      .single();
    if (sessionError) throw new Error(sessionError.message);

    // 2. Process each file — extract text and save document record
    const allTextParts = [];
    const errors = [];

    for (const file of files) {
      try {
        const text = await extractText(file.buffer, file.mimetype, file.originalname);
        allTextParts.push(`--- ${file.originalname} ---\n${text}`);

        // Upload original file to Supabase Storage
        const storagePath = `${req.user.id}/${session.id}/${file.originalname}`;
        await supabase.storage.from('documents').upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

        // Save document record
        await supabase.from('documents').insert({
          session_id: session.id,
          filename: file.originalname,
          storage_path: storagePath,
          extracted_text: text,
        });
      } catch (fileErr) {
        errors.push(`${file.originalname}: ${fileErr.message}`);
      }
    }

    if (allTextParts.length === 0) {
      // All files failed — delete the session and report errors
      await supabase.from('sessions').delete().eq('id', session.id);
      return res.status(400).json({ error: 'Could not extract text from any file.\n' + errors.join('\n') });
    }

    const combinedText = allTextParts.join('\n\n');

    res.json({
      sessionId: session.id,
      filesProcessed: allTextParts.length,
      filesTotal: files.length,
      charCount: combinedText.length,
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
