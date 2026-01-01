------------------------------------------------------------
-- Migration: Convert Period from enum to table
-- This migration:
-- 1. Creates periods table
-- 2. Inserts default periods (CA1-CA5)
-- 3. Adds period_id columns to schedules and time_preferences
-- 4. Migrates data from period (enum) to period_id (FK)
-- 5. Removes old period columns and constraints
-- 6. Adds foreign key constraints
--
-- This migration is idempotent and safe to run multiple times
------------------------------------------------------------

-- ===============================================
-- Create periods table
-- ===============================================
CREATE TABLE IF NOT EXISTS periods (
    id varchar(100) PRIMARY KEY,
    name varchar(50) NOT NULL UNIQUE,
    start_time time NOT NULL,
    end_time time NOT NULL,
    order_index integer NOT NULL UNIQUE,
    description varchar(255)
);

-- ===============================================
-- Insert default periods (CA1-CA5)
-- Default times: CA1=07:00-08:30, CA2=08:30-10:00, CA3=10:00-11:30, CA4=13:00-14:30, CA5=14:30-16:00
-- Note: Các period cách nhau ít nhất 30 phút (CA1 kết thúc 08:30, CA2 bắt đầu 08:30)
-- ===============================================
INSERT INTO periods (id, name, start_time, end_time, order_index, description) VALUES
    ('period-ca1', 'CA1', '07:00:00', '08:30:00', 1, 'Ca học 1'),
    ('period-ca2', 'CA2', '08:30:00', '10:00:00', 2, 'Ca học 2'),
    ('period-ca3', 'CA3', '10:00:00', '11:30:00', 3, 'Ca học 3'),
    ('period-ca4', 'CA4', '13:00:00', '14:30:00', 4, 'Ca học 4'),
    ('period-ca5', 'CA5', '14:30:00', '16:00:00', 5, 'Ca học 5')
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- Add period_id columns to schedules and time_preferences (if not exists)
-- ===============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'period_id') THEN
        ALTER TABLE schedules ADD COLUMN period_id varchar(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'time_preferences' AND column_name = 'period_id') THEN
        ALTER TABLE time_preferences ADD COLUMN period_id varchar(100);
    END IF;
END $$;

-- ===============================================
-- Migrate data from period (enum) to period_id (FK)
-- Only migrate if period column still exists and period_id is NULL
-- ===============================================
DO $$
BEGIN
    -- Check if period column exists in schedules
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'schedules' AND column_name = 'period') THEN
        UPDATE schedules 
        SET period_id = CASE period
            WHEN 'CA1' THEN 'period-ca1'
            WHEN 'CA2' THEN 'period-ca2'
            WHEN 'CA3' THEN 'period-ca3'
            WHEN 'CA4' THEN 'period-ca4'
            WHEN 'CA5' THEN 'period-ca5'
            ELSE NULL
        END
        WHERE period_id IS NULL;
    END IF;
    
    -- Check if period column exists in time_preferences
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'time_preferences' AND column_name = 'period') THEN
        UPDATE time_preferences 
        SET period_id = CASE period
            WHEN 'CA1' THEN 'period-ca1'
            WHEN 'CA2' THEN 'period-ca2'
            WHEN 'CA3' THEN 'period-ca3'
            WHEN 'CA4' THEN 'period-ca4'
            WHEN 'CA5' THEN 'period-ca5'
            ELSE NULL
        END
        WHERE period_id IS NULL;
    END IF;
END $$;

-- ===============================================
-- Make period_id NOT NULL after migration (only if column exists and has data)
-- ===============================================
DO $$
BEGIN
    -- For schedules
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'schedules' AND column_name = 'period_id') THEN
        -- Only set NOT NULL if all rows have period_id
        IF NOT EXISTS (SELECT 1 FROM schedules WHERE period_id IS NULL) THEN
            ALTER TABLE schedules ALTER COLUMN period_id SET NOT NULL;
        END IF;
    END IF;
    
    -- For time_preferences
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'time_preferences' AND column_name = 'period_id') THEN
        -- Only set NOT NULL if all rows have period_id
        IF NOT EXISTS (SELECT 1 FROM time_preferences WHERE period_id IS NULL) THEN
            ALTER TABLE time_preferences ALTER COLUMN period_id SET NOT NULL;
        END IF;
    END IF;
END $$;

-- ===============================================
-- Add foreign key constraints (if not exists)
-- ===============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_schedules_period' AND table_name = 'schedules') THEN
        ALTER TABLE schedules 
            ADD CONSTRAINT fk_schedules_period 
            FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE RESTRICT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_time_preferences_period' AND table_name = 'time_preferences') THEN
        ALTER TABLE time_preferences 
            ADD CONSTRAINT fk_time_preferences_period 
            FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- ===============================================
-- Update unique constraints to use period_id instead of period
-- ===============================================
-- Drop old unique constraints (if exist)
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS uq_schedule_section_day_period;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS uq_schedule_room_day_period;
ALTER TABLE time_preferences DROP CONSTRAINT IF EXISTS uq_timepref_teacher_semester_day_period;

-- Add new unique constraints with period_id (if not exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'uq_schedule_section_day_period' AND table_name = 'schedules') THEN
        ALTER TABLE schedules 
            ADD CONSTRAINT uq_schedule_section_day_period 
            UNIQUE(section_id, day, period_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'uq_schedule_room_day_period' AND table_name = 'schedules') THEN
        ALTER TABLE schedules 
            ADD CONSTRAINT uq_schedule_room_day_period 
            UNIQUE(room_id, day, period_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'uq_timepref_teacher_semester_day_period' AND table_name = 'time_preferences') THEN
        ALTER TABLE time_preferences 
            ADD CONSTRAINT uq_timepref_teacher_semester_day_period 
            UNIQUE(teacher_id, semester, day, period_id);
    END IF;
END $$;

-- ===============================================
-- Drop old period columns and constraints (if exist)
-- ===============================================
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS chk_schedule_period;
ALTER TABLE schedules DROP COLUMN IF EXISTS period;

ALTER TABLE time_preferences DROP CONSTRAINT IF EXISTS chk_timepref_period;
ALTER TABLE time_preferences DROP COLUMN IF EXISTS period;

-- ===============================================
-- Add indexes for period_id (if not exist)
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_schedules_period_id 
    ON schedules (period_id);

CREATE INDEX IF NOT EXISTS idx_time_preferences_period_id 
    ON time_preferences (period_id);

