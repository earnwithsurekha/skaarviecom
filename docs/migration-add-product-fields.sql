-- Migration script to add missing fields to existing products table
-- Run this to update your database with the new fields

USE skaarvi_resell_db;

-- Add brand_name column
ALTER TABLE products 
ADD COLUMN brand_name VARCHAR(200) AFTER slug;

-- Add catalog_url column
ALTER TABLE products 
ADD COLUMN catalog_url TEXT AFTER shipping_info;

-- Add shipping_charges column
ALTER TABLE products 
ADD COLUMN shipping_charges DECIMAL(10, 2) AFTER delivery_days;

-- Modify selling_price to be a regular column instead of generated
ALTER TABLE products 
MODIFY COLUMN selling_price DECIMAL(12, 2);

-- Add defaults to margin columns if not already set
ALTER TABLE products 
MODIFY COLUMN reseller_margin DECIMAL(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE products 
MODIFY COLUMN skaarvi_margin DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Add comments for clarity
ALTER TABLE products 
MODIFY COLUMN weight DECIMAL(8, 2) COMMENT 'Weight in kg';

ALTER TABLE products 
MODIFY COLUMN dimensions JSON COMMENT 'JSON: {length, width, height} in cm';

SELECT 'Migration completed successfully!' AS status;
