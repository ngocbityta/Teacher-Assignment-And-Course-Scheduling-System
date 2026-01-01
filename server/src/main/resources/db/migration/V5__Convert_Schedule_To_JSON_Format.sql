------------------------------------------------------------
-- Migration: Convert Schedule to JSON format
-- This migration:
-- 1. Drops old columns (teacher_id, section_id, room_id, day, start_period_id, period_count)
-- 2. Adds new columns: assignments (JSONB), statistics (JSONB), objective_value, penalties
-- 3. Migrates existing data to JSON format (if any)
------------------------------------------------------------

-- ===============================================
-- Add new columns for JSON format
-- ===============================================
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS assignments jsonb;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS statistics jsonb;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS objective_value integer;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS penalties jsonb;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS scores jsonb;

-- ===============================================
-- Migrate existing data to JSON format (if any exists)
-- ===============================================
-- This will convert existing schedule records to the new JSON format
-- Group by name and semester to create one record per schedule set
DO $$
DECLARE
    rec RECORD;
    assignment_json jsonb;
    assignments_array jsonb := '[]'::jsonb;
    stats_json jsonb;
    current_name text;
    current_semester text;
BEGIN
    -- Group existing schedules by name and semester
    FOR rec IN 
        SELECT DISTINCT name, semester 
        FROM schedules 
        WHERE name IS NOT NULL
    LOOP
        current_name := rec.name;
        current_semester := rec.semester;
        
        -- Build assignments array from existing schedules
        assignments_array := (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'teacher_id', t.id,
                    'section_id', s.id,
                    'classroom_id', c.id,
                    'day', CASE 
                        WHEN s.day = 'MONDAY' THEN 'Mon'
                        WHEN s.day = 'TUESDAY' THEN 'Tue'
                        WHEN s.day = 'WEDNESDAY' THEN 'Wed'
                        WHEN s.day = 'THURSDAY' THEN 'Thu'
                        WHEN s.day = 'FRIDAY' THEN 'Fri'
                        WHEN s.day = 'SATURDAY' THEN 'Sat'
                        WHEN s.day = 'SUNDAY' THEN 'Sun'
                        ELSE s.day::text
                    END,
                    'period', p.order_index::text
                )
            )
            FROM schedules s
            JOIN teachers t ON s.teacher_id = t.id
            JOIN sections sec ON s.section_id = sec.id
            JOIN classrooms c ON s.room_id = c.id
            JOIN periods p ON s.start_period_id = p.id
            WHERE s.name = current_name AND s.semester::text = current_semester
        );
        
        -- Build statistics
        stats_json := jsonb_build_object(
            'num_assignments', (SELECT COUNT(*) FROM schedules WHERE name = current_name AND semester::text = current_semester),
            'num_classrooms', (SELECT COUNT(DISTINCT room_id) FROM schedules WHERE name = current_name AND semester::text = current_semester),
            'num_courses', (SELECT COUNT(DISTINCT sec.course_id) FROM schedules s JOIN sections sec ON s.section_id = sec.id WHERE s.name = current_name AND s.semester::text = current_semester),
            'num_sections', (SELECT COUNT(DISTINCT section_id) FROM schedules WHERE name = current_name AND semester::text = current_semester),
            'num_teachers', (SELECT COUNT(DISTINCT teacher_id) FROM schedules WHERE name = current_name AND semester::text = current_semester)
        );
        
        -- Update the first record with JSON data (we'll delete duplicates later)
        UPDATE schedules
        SET assignments = assignments_array,
            statistics = stats_json
        WHERE id = (
            SELECT id FROM schedules 
            WHERE name = current_name AND semester::text = current_semester 
            LIMIT 1
        );
    END LOOP;
END $$;

-- ===============================================
-- Drop old columns
-- ===============================================
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS fk_schedules_teacher;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS fk_schedules_section;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS fk_schedules_classroom;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS fk_schedules_start_period;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS uq_schedule_section_day_start_period;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS uq_schedule_room_day_start_period;

ALTER TABLE schedules DROP COLUMN IF EXISTS teacher_id;
ALTER TABLE schedules DROP COLUMN IF EXISTS section_id;
ALTER TABLE schedules DROP COLUMN IF EXISTS room_id;
ALTER TABLE schedules DROP COLUMN IF EXISTS day;
ALTER TABLE schedules DROP COLUMN IF EXISTS start_period_id;
ALTER TABLE schedules DROP COLUMN IF EXISTS period_count;

-- ===============================================
-- Update unique constraint to only use name and semester
-- ===============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'uq_schedule_name_semester' AND table_name = 'schedules') THEN
        ALTER TABLE schedules 
            ADD CONSTRAINT uq_schedule_name_semester 
            UNIQUE(name, semester);
    END IF;
END $$;

-- ===============================================
-- Clean up duplicate records (keep only one per name+semester)
-- ===============================================
DELETE FROM schedules s1
WHERE s1.id IN (
    SELECT s2.id
    FROM schedules s2
    WHERE s2.name IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM schedules s3
        WHERE s3.name = s2.name
        AND s3.semester = s2.semester
        AND s3.id < s2.id
    )
);

-- ===============================================
-- Update indexes
-- ===============================================
DROP INDEX IF EXISTS idx_schedules_teacher_semester;
DROP INDEX IF EXISTS idx_schedules_start_period_id;
CREATE INDEX IF NOT EXISTS idx_schedules_name_semester 
    ON schedules (name, semester);
CREATE INDEX IF NOT EXISTS idx_schedules_assignments_gin 
    ON schedules USING GIN (assignments);

