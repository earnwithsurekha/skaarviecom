-- ============================================================================
-- SKAARVI RESELL MARKETPLACE - Store Feature Migration
-- ============================================================================
-- Description: Adds store functionality for resellers including personal store
--              pages with visit tracking and analytics
-- Created: Migration for Store Feature
-- ============================================================================

USE skaarvi_resell_db;

-- ============================================================================
-- 1. Add Store Fields to Resellers Table
-- ============================================================================

-- Add username field (for store URL: /store/username)
ALTER TABLE resellers 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE AFTER reseller_code;

-- Add store name and description fields
ALTER TABLE resellers 
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255) AFTER username,
ADD COLUMN IF NOT EXISTS store_description TEXT AFTER store_name;

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_resellers_username ON resellers(username);

-- Update existing resellers to have username (use reseller_code as default)
UPDATE resellers 
SET username = LOWER(REPLACE(reseller_code, 'SKR', 'res'))
WHERE username IS NULL OR username = '';

-- ============================================================================
-- 2. Create Store Visits Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS store_visits (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reseller_id CHAR(36) NOT NULL,
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    
    -- Foreign Keys
    FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_store_visits_reseller (reseller_id),
    INDEX idx_store_visits_ip (visitor_ip),
    INDEX idx_store_visits_date (visited_at),
    INDEX idx_store_visits_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. Add Indexes for Analytics Queries
-- ============================================================================

-- Index for date range queries on orders for store analytics
CREATE INDEX IF NOT EXISTS idx_orders_reseller_date ON orders(reseller_id, created_at);

-- Index for date range queries on store visits
CREATE INDEX IF NOT EXISTS idx_store_visits_reseller_date ON store_visits(reseller_id, visited_at);

-- ============================================================================
-- 4. Sample Data Update (Optional)
-- ============================================================================

-- Update store names for existing resellers if needed
-- UPDATE resellers SET store_name = full_name WHERE store_name IS NULL;

-- ============================================================================
-- 5. Verification Queries
-- ============================================================================

-- Check if columns were added successfully
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_SCHEMA = 'skaarvi_resell_db'
-- AND TABLE_NAME = 'resellers'
-- AND COLUMN_NAME IN ('username', 'store_name', 'store_description');

-- Check if store_visits table was created
-- SHOW TABLES LIKE 'store_visits';

-- Check indexes
-- SHOW INDEXES FROM resellers WHERE Key_name LIKE 'idx_resellers_username';
-- SHOW INDEXES FROM store_visits;

-- ============================================================================
-- Migration Complete
-- ============================================================================
