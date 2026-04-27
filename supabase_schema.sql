-- ============================================================
-- ExamsPulse — Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_name   TEXT NOT NULL,
  mode          TEXT NOT NULL DEFAULT 'mixed',
  question_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id     UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  filename       TEXT NOT NULL,
  storage_path   TEXT,
  extracted_text TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL,
  question    TEXT NOT NULL,
  options     JSONB,
  answer      TEXT NOT NULL,
  explanation TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──
ALTER TABLE sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users view own sessions"   ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users view own docs"   ON documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = documents.session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users insert own docs" ON documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sessions s WHERE s.id = documents.session_id AND s.user_id = auth.uid()));

-- Questions policies
CREATE POLICY "Users view own questions"   ON questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = questions.session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users insert own questions" ON questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sessions s WHERE s.id = questions.session_id AND s.user_id = auth.uid()));

-- ── Storage bucket for PDFs ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users upload own docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own docs"   ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
