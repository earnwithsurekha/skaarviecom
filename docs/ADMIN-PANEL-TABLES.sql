-- ============================================================================
-- SKAARVI ADMIN PANEL - Additional Tables Migration
-- ============================================================================
-- This script creates additional tables needed for admin panel features
-- Run this after the main DATABASE-SCHEMA-MYSQL.sql
-- ============================================================================

USE skaarvi_resell_db;

-- ============================================================================
-- 1. WITHDRAWALS TABLE (Simplified for admin panel)
-- ============================================================================
-- Note: Use this simplified table OR map to withdrawal_requests if it exists
DROP TABLE IF EXISTS withdrawals;

CREATE TABLE withdrawals (
    withdrawalId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    paymentMethod VARCHAR(100) DEFAULT 'Bank Transfer',
    accountNumber VARCHAR(50),
    ifscCode VARCHAR(20),
    accountHolderName VARCHAR(255),
    upiId VARCHAR(100),
    transactionId VARCHAR(255),
    remarks TEXT,
    approvedBy INT,
    approvedAt TIMESTAMP NULL,
    paidAt TIMESTAMP NULL,
    rejectedAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP NULL,
    INDEX idx_withdrawals_user (userId),
    INDEX idx_withdrawals_status (status),
    INDEX idx_withdrawals_date (createdAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. SETTLEMENTS TABLE (For manufacturer payments)
-- ============================================================================
DROP TABLE IF EXISTS settlements;

CREATE TABLE settlements (
    settlementId INT AUTO_INCREMENT PRIMARY KEY,
    manufacturerId INT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    totalOrderValue DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    platformFeePercentage DECIMAL(5, 2) DEFAULT 5.00,
    platformFeeAmount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(15, 2) NOT NULL, -- Net amount payable to manufacturer
    orderCount INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    accountNumber VARCHAR(50),
    ifscCode VARCHAR(20),
    accountHolderName VARCHAR(255),
    transactionId VARCHAR(255),
    transactionDetails TEXT,
    paidBy INT,
    paidAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settlements_manufacturer (manufacturerId),
    INDEX idx_settlements_status (status),
    INDEX idx_settlements_date (createdAt DESC),
    INDEX idx_settlements_period (startDate, endDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. SAMPLE DATA (OPTIONAL - COMMENTED OUT)
-- ============================================================================
-- Uncomment below to add sample data for testing

-- -- Insert sample withdrawals (if users table has data)
-- INSERT INTO withdrawals (userId, amount, status, paymentMethod, accountNumber, ifscCode, accountHolderName, createdAt)
-- SELECT 
--     userId, 
--     ROUND(1000 + (RAND() * 9000), 2) as amount,
--     CASE 
--         WHEN RAND() < 0.3 THEN 'pending'
--         WHEN RAND() < 0.6 THEN 'approved'
--         WHEN RAND() < 0.9 THEN 'paid'
--         ELSE 'rejected'
--     END as status,
--     'Bank Transfer' as paymentMethod,
--     CONCAT('****', LPAD(FLOOR(RAND() * 10000), 4, '0')) as accountNumber,
--     CONCAT('SBIN', LPAD(FLOOR(RAND() * 1000000), 7, '0')) as ifscCode,
--     fullName as accountHolderName,
--     DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY) as createdAt
-- FROM users 
-- WHERE role = 'reseller' 
-- LIMIT 10;

-- -- Insert sample settlements (if manufacturers table has data)
-- INSERT INTO settlements (
--     manufacturerId, 
--     startDate, 
--     endDate, 
--     totalOrderValue, 
--     platformFeeAmount, 
--     amount, 
--     orderCount, 
--     status, 
--     createdAt
-- )
-- SELECT 
--     userId as manufacturerId,
--     DATE_SUB(CURDATE(), INTERVAL 30 DAY) as startDate,
--     CURDATE() as endDate,
--     ROUND(50000 + (RAND() * 200000), 2) as totalOrderValue,
--     ROUND((50000 + (RAND() * 200000)) * 0.05, 2) as platformFeeAmount,
--     ROUND((50000 + (RAND() * 200000)) * 0.95, 2) as amount,
--     FLOOR(10 + (RAND() * 40)) as orderCount,
--     CASE 
--         WHEN RAND() < 0.4 THEN 'pending'
--         WHEN RAND() < 0.9 THEN 'paid'
--         ELSE 'failed'
--     END as status,
--     DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 15) DAY) as createdAt
-- FROM users 
-- WHERE role = 'manufacturer'
-- LIMIT 8;

-- ============================================================================
-- 4. CREATE VIEWS FOR ADMIN DASHBOARD
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS admin_dashboard_stats;

-- View for dashboard statistics
CREATE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM orders WHERE deletedAt IS NULL) as totalOrders,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending' AND deletedAt IS NULL) as pendingOrders,
    (SELECT COUNT(*) FROM orders WHERE DATE(createdAt) = CURDATE() AND deletedAt IS NULL) as todayOrders,
    (SELECT COALESCE(SUM(totalAmount), 0) FROM orders WHERE deletedAt IS NULL) as totalRevenue,
    (SELECT COALESCE(SUM(totalAmount), 0) FROM orders WHERE DATE(createdAt) = CURDATE() AND deletedAt IS NULL) as todayRevenue,
    (SELECT COALESCE(SUM(totalAmount), 0) FROM orders WHERE MONTH(createdAt) = MONTH(CURDATE()) AND YEAR(createdAt) = YEAR(CURDATE()) AND deletedAt IS NULL) as monthlyRevenue,
    (SELECT COUNT(*) FROM products WHERE deletedAt IS NULL) as totalProducts,
    (SELECT COUNT(*) FROM users WHERE role = 'manufacturer' AND deletedAt IS NULL) as totalManufacturers,
    (SELECT COUNT(*) FROM users WHERE role = 'reseller' AND deletedAt IS NULL) as totalResellers,
    (SELECT COUNT(*) FROM users WHERE role = 'customer' AND deletedAt IS NULL) as totalCustomers;

-- ============================================================================
-- 5. USEFUL QUERIES FOR DEVELOPMENT
-- ============================================================================

-- Check if tables exist and have data
-- SELECT 'withdrawals' as table_name, COUNT(*) as record_count FROM withdrawals
-- UNION ALL
-- SELECT 'settlements', COUNT(*) FROM settlements
-- UNION ALL
-- SELECT 'orders', COUNT(*) FROM orders
-- UNION ALL
-- SELECT 'categories', COUNT(*) FROM categories;

-- View dashboard statistics
-- SELECT * FROM admin_dashboard_stats;

-- Add sample data manually if needed for testing:
-- Uncomment the INSERT statements in section 3 above, or write your own
-- Clear all data from a table if needed (CAUTION: This deletes data!)
-- TRUNCATE TABLE withdrawals;
-- TRUNCATE TABLE settlements;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Run DATABASE-SCHEMA-MYSQL.sql first to create main tables
-- 2. Run this script to add admin panel specific tables
-- 3. No sample data is inserted - tables are created empty
-- 4. To add sample data, uncomment the INSERT statements in section 3
-- 5. The userId fields assume integer IDs, adjust if using UUIDs
-- 6. Run using: node backend/setup-admin-tables.js
-- ============================================================================
