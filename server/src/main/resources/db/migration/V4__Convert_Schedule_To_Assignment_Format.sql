------------------------------------------------------------
-- Migration: Convert Schedule from period-based to assignment-based
-- This migration:
-- 1. Adds start_period_id and period_count columns
-- 2. Migrates existing data (each period becomes an assignment with period_count=1)
-- 3. Removes period_id column and related constraints
-- 4. Updates unique constraints to use start_period_id
------------------------------------------------------------

-- ===============================================
-- Add new columns for assignment format
-- ===============================================
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS start_period_id varchar(100);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS period_count integer DEFAULT 1;

-- ===============================================
-- Migrate existing data: copy period_id to start_period_id
-- ===============================================
UPDATE schedules 
SET start_period_id = period_id, period_count = 1
WHERE start_period_id IS NULL;

-- ===============================================
-- Make start_period_id NOT NULL after migration
-- ===============================================
ALTER TABLE schedules ALTER COLUMN start_period_id SET NOT NULL;
ALTER TABLE schedules ALTER COLUMN period_count SET NOT NULL;
ALTER TABLE schedules ALTER COLUMN period_count SET DEFAULT 1;

-- ===============================================
-- Add foreign key for start_period_id
-- ===============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_schedules_start_period' AND table_name = 'schedules') THEN
        ALTER TABLE schedules 
            ADD CONSTRAINT fk_schedules_start_period 
            FOREIGN KEY (start_period_id) REFERENCES periods(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- ===============================================
-- Drop old unique constraints and period_id column
-- ===============================================
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS uq_schedule_section_day_period;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS uq_schedule_room_day_period;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS fk_schedules_period;

-- ===============================================
-- Add new unique constraints for assignment format
-- ===============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'uq_schedule_section_day_start_period' AND table_name = 'schedules') THEN
        ALTER TABLE schedules 
            ADD CONSTRAINT uq_schedule_section_day_start_period 
            UNIQUE(section_id, day, start_period_id, name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'uq_schedule_room_day_start_period' AND table_name = 'schedules') THEN
        ALTER TABLE schedules 
            ADD CONSTRAINT uq_schedule_room_day_start_period 
            UNIQUE(room_id, day, start_period_id, name);
    END IF;
END $$;

-- ===============================================
-- Drop old period_id column
-- ===============================================
ALTER TABLE schedules DROP COLUMN IF EXISTS period_id;

-- ===============================================
-- Update indexes
-- ===============================================
DROP INDEX IF EXISTS idx_schedules_period_id;
CREATE INDEX IF NOT EXISTS idx_schedules_start_period_id 
    ON schedules (start_period_id);

