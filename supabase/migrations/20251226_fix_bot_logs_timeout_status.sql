-- Migration: Fix bot_logs status check constraint to include 'timeout'
-- Date: 2025-12-26
-- Issue: 'timeout' status not allowed, causing constraint violation error
-- Error: 'new row for relation "bot_logs" violates check constraint "bot_logs_status_check"'

-- Step 0: Check existing values (run this first to see what's there)
-- SELECT DISTINCT status FROM bot_logs;

-- Step 1: Fix any invalid status values (run before adding constraint)
UPDATE bot_logs SET status = 'failed' WHERE status NOT IN ('idle', 'running', 'completed', 'failed', 'timeout');

-- Step 2: Drop existing constraint
ALTER TABLE bot_logs DROP CONSTRAINT IF EXISTS bot_logs_status_check;

-- Step 3: Add new constraint with 'timeout' included
ALTER TABLE bot_logs ADD CONSTRAINT bot_logs_status_check
CHECK (status IN ('idle', 'running', 'completed', 'failed', 'timeout'));

-- Verify the change
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'bot_logs'::regclass;
