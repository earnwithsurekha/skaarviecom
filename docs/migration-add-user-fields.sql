-- ============================================================================
-- Add missing fields to users table for authentication
-- ============================================================================

USE skaarvi_resell_db;

-- Add password field for authentication
ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER email;

-- Add full_name for user display
ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NULL AFTER password;

-- Add profile photo
ALTER TABLE users ADD COLUMN profile_photo TEXT NULL AFTER full_name;

-- Add city and state for basic location
ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL AFTER profile_photo;

-- Add state
ALTER TABLE users ADD COLUMN state VARCHAR(100) NULL AFTER city;

-- Add address and pincode
ALTER TABLE users ADD COLUMN address TEXT NULL AFTER state;

-- Add pincode
ALTER TABLE users ADD COLUMN pincode VARCHAR(10) NULL AFTER address;

-- Add status for approval workflow
ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active' AFTER pincode;
