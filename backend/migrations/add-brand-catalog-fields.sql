-- ============================================================================
-- Migration: Add brand_name and catalog_url fields to products table
-- Description: Adds missing product fields for brand and catalog PDF
-- Date: June 28, 2026
-- ============================================================================

USE skaarvi_resell_db;

-- Check if columns exist before adding (safe to re-run)

-- Add brand_name column if not exists
SET @dbname = DATABASE();
SET @tablename = 'products';
SET @columnname = 'brand_name';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(200) AFTER slug')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add catalog_url column if not exists
SET @columnname = 'catalog_url';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT AFTER shipping_info')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

COMMIT;

SELECT 'Migration completed! Added brand_name and catalog_url fields to products table.' AS status;

-- ============================================================================
-- Usage:
-- mysql -u root -pArun@535 skaarvi_resell_db < migrations/add-brand-catalog-fields.sql
-- ============================================================================
