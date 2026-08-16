-- Migration: Make GST Number Optional
-- Date: 2026-06-14
-- Description: Change gst_number column to allow NULL values since GST is optional

USE skaarvi_resell_db;

-- Remove UNIQUE constraint and make gst_number nullable
ALTER TABLE manufacturers 
MODIFY COLUMN gst_number VARCHAR(15) NULL;

-- Remove unique index if exists
ALTER TABLE manufacturers 
DROP INDEX gst_number;

-- Add back index without unique constraint (for performance)
CREATE INDEX idx_manufacturers_gst_number ON manufacturers(gst_number);

-- Verify the change
SELECT 
    COLUMN_NAME, 
    IS_NULLABLE, 
    DATA_TYPE, 
    COLUMN_TYPE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'skaarvi_resell_db' 
  AND TABLE_NAME = 'manufacturers' 
  AND COLUMN_NAME = 'gst_number';
