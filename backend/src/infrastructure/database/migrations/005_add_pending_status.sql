-- 005_add_pending_status.sql
-- Add 'pending' to the allowed debate status values
-- SQLite doesn't allow modifying CHECK constraints directly, so we need to recreate the table

-- Create new table with updated constraint
CREATE TABLE debates_new (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'active', 'completed', 'paused')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  moderator_id TEXT,
  current_round INTEGER DEFAULT 1,
  total_rounds INTEGER,
  settings TEXT
);

-- Copy existing data
INSERT INTO debates_new SELECT * FROM debates;

-- Drop old table
DROP TABLE debates;

-- Rename new table
ALTER TABLE debates_new RENAME TO debates;

-- Recreate indexes
CREATE INDEX idx_debates_status ON debates(status);
CREATE INDEX idx_debates_created_at ON debates(created_at);

-- Track applied migration
INSERT OR REPLACE INTO migrations (id, name) VALUES ('005', '005_add_pending_status.sql');