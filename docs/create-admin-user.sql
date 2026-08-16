-- Create Admin User for Testing
-- Run this in MySQL Workbench or command line

USE skaarvi_resell_db;

-- Insert admin user (mobile field is required in database)
INSERT INTO users (id, email, mobile, role, is_verified, is_active, created_at, updated_at) 
VALUES (
  UUID(), 
  'admin@skaarvi.com',
  '9999999999',  -- Dummy mobile for admin
  'admin', 
  1, 
  1, 
  NOW(), 
  NOW()
);

-- Verify admin user was created
SELECT id, email, mobile, role, is_verified, created_at 
FROM users 
WHERE role = 'admin';
