-- Migration 001: Initial Schema
-- Creates the foundation tables for topic management and future debate functionality

-- Migration tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Topics table for current single-topic responses
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  llm_response TEXT,               -- JSON serialized LLMResponse
  model TEXT,
  timestamp DATETIME,              -- Response timestamp
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  has_requested_response INTEGER DEFAULT 0,  -- Boolean flag for request tracking
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Future: Debates table for multi-LLM discussions
CREATE TABLE IF NOT EXISTS debates (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  status TEXT CHECK(status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Future: Participants table for debate members
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  debate_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('llm', 'user')) NOT NULL,
  name TEXT NOT NULL,
  model TEXT,  -- For LLM participants
  FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE
);

-- Future: Rounds table for debate structure
CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY,
  debate_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE
);

-- Future: Responses table for individual messages
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(name);
CREATE INDEX IF NOT EXISTS idx_topics_updated_at ON topics(updated_at);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debates_created_at ON debates(created_at);
CREATE INDEX IF NOT EXISTS idx_rounds_debate_id ON rounds(debate_id);
CREATE INDEX IF NOT EXISTS idx_responses_round_id ON responses(round_id);
CREATE INDEX IF NOT EXISTS idx_responses_participant_id ON responses(participant_id);

-- Insert migration record
INSERT OR REPLACE INTO migrations (id, name) VALUES ('001', '001_initial_schema.sql');