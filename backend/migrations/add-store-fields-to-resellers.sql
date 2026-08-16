-- Add store_name and store_description columns to resellers table
-- Run this in your MySQL database

ALTER TABLE resellers
ADD COLUMN store_name VARCHAR(255) NULL AFTER full_name,
ADD COLUMN store_description TEXT NULL AFTER store_name;

-- Optional: Set default store name based on full_name for existing records
UPDATE resellers 
SET store_name = CONCAT(full_name, "'s Store") 
WHERE store_name IS NULL;
