-- Migration 002: Debaters Schema
-- Creates debaters table for custom LLM model configurations

-- Debaters table for customized LLM configurations
CREATE TABLE IF NOT EXISTS debaters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  model TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,  -- Boolean flag for active debaters
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add debater_id to topics table to track which debater generated each response
ALTER TABLE topics ADD COLUMN debater_id TEXT;

-- Create foreign key constraint (if supported by SQLite version)
-- Note: This will be handled in the repository layer for compatibility

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_debaters_name ON debaters(name);
CREATE INDEX IF NOT EXISTS idx_debaters_is_active ON debaters(is_active);
CREATE INDEX IF NOT EXISTS idx_topics_debater_id ON topics(debater_id);

-- Insert default debater for backward compatibility
INSERT OR REPLACE INTO debaters (
  id, 
  name, 
  description, 
  model, 
  system_prompt,
  is_active
) VALUES (
  'default',
  'Default Assistant',
  'The original helpful assistant for topic discussions',
  'llama2',
  'You are a helpful assistant in an application called Eristic. When a user provides a topic, provide informative, engaging, and well-structured content about that topic. Be concise but comprehensive, and format your response in a readable way.',
  1
);

-- Insert migration record
INSERT OR REPLACE INTO migrations (id, name) VALUES ('002', '002_debaters_schema.sql');