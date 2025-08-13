-- 003_multi_debate_schema.sql
-- Multi-debate platform schema with proper naming consistency

-- Debates table - core debate information
CREATE TABLE IF NOT EXISTS debates (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  moderator_id TEXT NOT NULL,
  current_round INTEGER DEFAULT 1,
  total_rounds INTEGER NOT NULL,
  settings TEXT, -- JSON serialized DebateSettings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moderator_id) REFERENCES debaters(id)
);

-- Debate participants - debaters participating in a debate
CREATE TABLE IF NOT EXISTS debate_participants (
  id TEXT PRIMARY KEY,
  debate_id TEXT NOT NULL,
  debater_id TEXT NOT NULL,
  position INTEGER NOT NULL, -- Turn order (1, 2, 3...)
  role TEXT DEFAULT 'debater', -- 'debater' or 'moderator'
  FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE,
  FOREIGN KEY (debater_id) REFERENCES debaters(id)
);

-- Debate rounds - individual rounds within a debate
CREATE TABLE IF NOT EXISTS debate_rounds (
  id TEXT PRIMARY KEY,
  debate_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  moderation_summary TEXT, -- Summary from moderator
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE
);

-- Debate responses - individual responses within rounds
CREATE TABLE IF NOT EXISTS debate_responses (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  debater_id TEXT NOT NULL,
  content TEXT NOT NULL,
  response_order INTEGER NOT NULL, -- Order within the round
  model TEXT, -- Which model was used
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES debate_rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (debater_id) REFERENCES debaters(id)
);

-- User settings - debate configuration preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  debate_settings TEXT, -- JSON serialized default settings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debates_created_at ON debates(created_at);
CREATE INDEX IF NOT EXISTS idx_debate_participants_debate_id ON debate_participants(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_rounds_debate_id ON debate_rounds(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_rounds_round_number ON debate_rounds(debate_id, round_number);
CREATE INDEX IF NOT EXISTS idx_debate_responses_round_id ON debate_responses(round_id);
CREATE INDEX IF NOT EXISTS idx_debate_responses_order ON debate_responses(round_id, response_order);

-- Track applied migration
INSERT OR REPLACE INTO migrations (id, name) VALUES ('003', '003_multi_debate_schema.sql');