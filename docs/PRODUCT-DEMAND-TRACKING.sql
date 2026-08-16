-- ============================================================================
-- PRODUCT DEMAND TRACKING TABLES
-- ============================================================================
-- Purpose: Track product interactions for demand analytics
-- Tables: product_clicks, product_saves, product_shares
-- ============================================================================

USE skaarvi_resell_db;

-- Product Clicks Tracking
CREATE TABLE IF NOT EXISTS product_clicks (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36),
    reseller_id CHAR(36),
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    click_source VARCHAR(100), -- 'search', 'category', 'featured', 'recommendation', etc.
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE SET NULL,
    INDEX idx_product_clicks_product (product_id),
    INDEX idx_product_clicks_user (user_id),
    INDEX idx_product_clicks_reseller (reseller_id),
    INDEX idx_product_clicks_date (clicked_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Saves/Wishlist Tracking
CREATE TABLE IF NOT EXISTS product_saves (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    reseller_id CHAR(36),
    is_active BOOLEAN DEFAULT TRUE, -- FALSE when removed from wishlist
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMP NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_product_save (user_id, product_id),
    INDEX idx_product_saves_product (product_id),
    INDEX idx_product_saves_user (user_id),
    INDEX idx_product_saves_reseller (reseller_id),
    INDEX idx_product_saves_active (is_active),
    INDEX idx_product_saves_date (saved_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Shares Tracking
CREATE TABLE IF NOT EXISTS product_shares (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36),
    reseller_id CHAR(36),
    share_platform VARCHAR(100), -- 'whatsapp', 'facebook', 'twitter', 'telegram', 'link', etc.
    share_medium VARCHAR(50), -- 'social', 'messaging', 'email', 'copy_link'
    session_id VARCHAR(255),
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reseller_id) REFERENCES resellers(id) ON DELETE SET NULL,
    INDEX idx_product_shares_product (product_id),
    INDEX idx_product_shares_user (user_id),
    INDEX idx_product_shares_reseller (reseller_id),
    INDEX idx_product_shares_platform (share_platform),
    INDEX idx_product_shares_date (shared_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Sample Data Insertion (for testing)
-- ============================================================================

-- Note: Run this after the tables are created and you have existing products/users
-- This will generate some sample tracking data for testing the analytics

-- Sample Clicks (uncomment to insert test data)
-- INSERT INTO product_clicks (product_id, user_id, click_source, clicked_at)
-- SELECT 
--     p.id,
--     (SELECT id FROM users WHERE role = 'reseller' LIMIT 1),
--     'category',
--     DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
-- FROM products p
-- LIMIT 50;

-- Sample Saves (uncomment to insert test data)
-- INSERT INTO product_saves (product_id, user_id, is_active)
-- SELECT 
--     p.id,
--     (SELECT id FROM users WHERE role = 'reseller' ORDER BY RAND() LIMIT 1),
--     TRUE
-- FROM products p
-- ORDER BY RAND()
-- LIMIT 20;

-- Sample Shares (uncomment to insert test data)
-- INSERT INTO product_shares (product_id, user_id, share_platform, share_medium)
-- SELECT 
--     p.id,
--     (SELECT id FROM users WHERE role = 'reseller' ORDER BY RAND() LIMIT 1),
--     ELT(FLOOR(1 + RAND() * 5), 'whatsapp', 'facebook', 'twitter', 'telegram', 'link'),
--     ELT(FLOOR(1 + RAND() * 3), 'social', 'messaging', 'copy_link')
-- FROM products p
-- ORDER BY RAND()
-- LIMIT 30;
