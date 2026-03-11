CREATE TABLE IF NOT EXISTS books (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  rotation DOUBLE PRECISION NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'tall', 'wide')),
  thickness INTEGER NOT NULL CHECK (thickness >= 1 AND thickness <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS books_title_author_lower_idx
  ON books (LOWER(title), LOWER(author));

CREATE TABLE IF NOT EXISTS recommendations (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  story TEXT NOT NULL,
  date_added DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual_form',
  q1_transcript TEXT,
  q2_transcript TEXT,
  audio_file TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exhibit_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO exhibit_state (key, value) VALUES ('mode', 'playing')
ON CONFLICT (key) DO NOTHING;
