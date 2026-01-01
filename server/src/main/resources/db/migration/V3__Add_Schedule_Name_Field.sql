------------------------------------------------------------
-- Migration: Add name field to schedules table
-- This allows users to name their schedule sets
------------------------------------------------------------

-- Add name column to schedules table
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS name varchar(255);

-- Create an index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_schedules_name ON schedules (name);

-- Add a comment to explain the purpose of the name column
COMMENT ON COLUMN schedules.name IS 'Name of the schedule set, e.g. "Lịch học kỳ 1 - v1"';
