------------------------------------------------------------
-- Migration: Add scores column to schedules table
------------------------------------------------------------

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS scores jsonb;

