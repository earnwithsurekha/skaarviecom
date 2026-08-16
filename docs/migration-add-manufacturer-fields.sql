-- Migration script to add missing fields to manufacturers table
-- Run this to update your database with registration form fields

USE skaarvi_resell_db;

-- Add brand_name column
ALTER TABLE manufacturers 
ADD COLUMN brand_name VARCHAR(255) AFTER company_name;

-- Add business_type column
ALTER TABLE manufacturers 
ADD COLUMN business_type VARCHAR(100) AFTER contact_person;

-- Add pan_number column
ALTER TABLE manufacturers 
ADD COLUMN pan_number VARCHAR(10) AFTER gst_number;

-- Add bank_name column
ALTER TABLE manufacturers 
ADD COLUMN bank_name VARCHAR(255) AFTER bank_account_holder;

-- Add gst_certificate_url column
ALTER TABLE manufacturers 
ADD COLUMN gst_certificate_url TEXT AFTER company_logo_url;

-- Add pan_card_url column
ALTER TABLE manufacturers 
ADD COLUMN pan_card_url TEXT AFTER gst_certificate_url;

-- Add cancelled_cheque_url column
ALTER TABLE manufacturers 
ADD COLUMN cancelled_cheque_url TEXT AFTER pan_card_url;

SELECT 'Manufacturers table migration completed successfully!' AS status;
DESCRIBE manufacturers;
