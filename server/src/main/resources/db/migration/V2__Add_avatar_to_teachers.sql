-- Add avatar column to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);

