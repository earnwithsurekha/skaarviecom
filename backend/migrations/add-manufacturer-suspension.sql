-- Migration: Add suspension tracking to manufacturers table
-- Date: 2024
-- Description: Adds is_active and suspension_reason columns to manufacturers table

-- Add is_active column (defaults to TRUE for existing records)
ALTER TABLE manufacturers
ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER rejection_reason;

-- Add suspension_reason column
ALTER TABLE manufacturers
ADD COLUMN suspension_reason TEXT NULL AFTER is_active;

-- Add index for quick filtering of active manufacturers
CREATE INDEX idx_manufacturers_active ON manufacturers(is_active);

-- Update comment
ALTER TABLE manufacturers 
COMMENT = 'Stores manufacturer/brand information with approval status and suspension tracking';
