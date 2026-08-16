-- Migration: Add Return Workflow Columns to Orders Table
-- Description: Adds columns to support customer order returns with admin approval workflow
-- Date: 2026-06-27

-- Add return workflow columns to orders table
-- Note: Columns will only be added if they don't already exist (handled by error checking in code)
ALTER TABLE orders
ADD COLUMN return_requested_at DATETIME NULL COMMENT 'Timestamp when return was requested by customer',
ADD COLUMN return_reason TEXT NULL COMMENT 'Customer reason for return request',
ADD COLUMN return_status VARCHAR(50) NULL COMMENT 'Status of return request: pending, approved, rejected',
ADD COLUMN return_approved_at DATETIME NULL COMMENT 'Timestamp when return was approved by admin',
ADD COLUMN return_rejected_at DATETIME NULL COMMENT 'Timestamp when return was rejected by admin',
ADD COLUMN admin_notes TEXT NULL COMMENT 'Admin notes for return approval/rejection',
ADD COLUMN return_images TEXT NULL COMMENT 'JSON array of S3 URLs for return product images uploaded by customer';

-- Add index for efficient return queries
CREATE INDEX idx_orders_return_status 
ON orders(return_status, return_requested_at);

-- Add index for customer return lookups
CREATE INDEX idx_orders_customer_return 
ON orders(customer_id, return_status, return_requested_at);

-- Update order_status CHECK constraint to include return_requested intermediate status
-- Note: MySQL doesn't support adding to existing CHECK constraints, so we need to drop and recreate
-- First, check if the constraint exists and drop it
ALTER TABLE orders DROP CHECK orders_chk_3;

-- Recreate the constraint with the new status
ALTER TABLE orders
ADD CONSTRAINT orders_chk_3 
CHECK (order_status IN ('new', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'return_requested'));

-- Verify the changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'skaarvi_resell_db'
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME IN (
      'return_requested_at',
      'return_reason',
      'return_status',
      'return_approved_at',
      'return_rejected_at',
      'admin_notes',
      'return_images'
  )
ORDER BY ORDINAL_POSITION;

-- Verify indexes
SHOW INDEX FROM orders 
WHERE Key_name IN ('idx_orders_return_status', 'idx_orders_customer_return');
