-- ============================================================================
-- INVENTORY MANAGEMENT - Stock Logs Table Migration
-- ============================================================================
-- Add this to your MySQL database after products table is created

-- Stock Logs Table - Track all stock changes
CREATE TABLE IF NOT EXISTS stock_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    manufacturer_id CHAR(36) NOT NULL,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('increase', 'decrease', 'update', 'order_placed', 'order_cancelled', 'adjustment')),
    quantity_change INT NOT NULL COMMENT 'Positive for increase, negative for decrease',
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    changed_by CHAR(36),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_stock_logs_product (product_id),
    INDEX idx_stock_logs_manufacturer (manufacturer_id),
    INDEX idx_stock_logs_date (changed_at DESC),
    INDEX idx_stock_logs_type (change_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables exist
SELECT 'Stock logs table created successfully' AS status;

-- Sample queries for testing
-- View recent stock changes:
-- SELECT sl.*, p.name as product_name 
-- FROM stock_logs sl 
-- JOIN products p ON sl.product_id = p.id 
-- ORDER BY sl.changed_at DESC LIMIT 20;

-- View stock changes for specific product:
-- SELECT * FROM stock_logs WHERE product_id = 'your-product-id' ORDER BY changed_at DESC;

-- View low stock products:
-- SELECT id, name, stock_quantity, low_stock_threshold 
-- FROM products 
-- WHERE stock_quantity <= low_stock_threshold;
