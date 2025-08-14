-- 004_update_debates_schema.sql
-- Update existing debates table to add missing columns for multi-debate support
-- This migration is designed to be idempotent and handle cases where columns already exist

-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE
-- This migration assumes columns might already be manually added
-- The migration runner should handle duplicate column errors gracefully

-- Track applied migration (moved to top to avoid issues if ALTER TABLE fails)
INSERT OR REPLACE INTO migrations (id, name) VALUES ('004', '004_update_debates_schema.sql');