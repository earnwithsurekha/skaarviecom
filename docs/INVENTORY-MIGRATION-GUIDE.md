# Inventory Management - Database Migration Guide

## Overview
This guide explains the database changes required for the Inventory Management feature.

## Database Status

### ✅ **Already Existing Tables (No Changes Needed)**
These tables already exist in your database schema:

1. **`notifications` table** - Located at line 542 in DATABASE-SCHEMA-MYSQL.sql
   - Used for low stock alerts and other notifications
   - Already has all required fields:
     - `id`, `user_id`, `type`, `title`, `message`, `data` (JSON)
     - `is_read`, `read_at`, `priority`, `created_at`
   - ✅ No modifications needed

2. **`products` table** - Already has inventory fields:
   - `stock_quantity` - Current stock level
   - `low_stock_threshold` - Alert threshold
   - `sales_count` - Total units sold
   - ✅ No modifications needed

### 🆕 **New Table Required**

**`stock_logs` table** - Tracks all inventory changes
- **Status:** ✅ Added to DATABASE-SCHEMA-MYSQL.sql (section 3.6)
- **Purpose:** Complete audit trail of stock changes
- **Location:** After product_pricing_history table
- **Fields:**
  - `id` - Primary key (UUID)
  - `product_id` - Reference to products table
  - `manufacturer_id` - Reference to manufacturers table
  - `change_type` - Type of change (increase, decrease, update, order_placed, order_cancelled, adjustment)
  - `quantity_change` - Amount changed (positive/negative)
  - `previous_stock` - Stock before change
  - `new_stock` - Stock after change
  - `reason` - Reason for change
  - `notes` - Additional notes
  - `changed_by` - User who made the change
  - `changed_at` - Timestamp of change

---

## Migration Steps

### Option 1: Create Single Table (Quick Setup)

If your database already has the other tables, run only this SQL:

```sql
USE skaarvi_resell_db;

-- Create Stock Logs Table
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

-- Verify table creation
SHOW CREATE TABLE stock_logs;

-- Check if table is empty (should be)
SELECT COUNT(*) as total_logs FROM stock_logs;
```

**Result:** Creates only the `stock_logs` table.

---

### Option 2: Run Complete Schema (Fresh Installation)

If you're setting up a fresh database, run the complete schema:

```bash
# Location: docs/DATABASE-SCHEMA-MYSQL.sql
# This creates ALL tables including stock_logs
```

1. Open MySQL client:
   ```bash
   mysql -u root -p
   ```

2. Run the schema file:
   ```sql
   SOURCE /path/to/skaarvi-reseller/docs/DATABASE-SCHEMA-MYSQL.sql;
   ```

---

## Verification Steps

After running the migration, verify the setup:

```sql
-- 1. Check if stock_logs table exists
SHOW TABLES LIKE 'stock_logs';

-- 2. Verify stock_logs structure
DESC stock_logs;

-- 3. Verify notifications table exists (should already exist)
DESC notifications;

-- 4. Check products table has inventory fields
DESC products;
-- Should show: stock_quantity, low_stock_threshold, sales_count

-- 5. Verify foreign key relationships
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'stock_logs'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Expected results:
-- product_id -> products(id)
-- manufacturer_id -> manufacturers(id)
-- changed_by -> users(id)
```

---

## Sequelize Models Status

The backend Sequelize models are already created:

✅ **backend/models/stockLog.js** - StockLog model
- Maps to `stock_logs` table
- Defines associations with Product and User models
- Status: **Created and ready**

✅ **backend/models/notification.js** - Notification model
- Maps to `notifications` table
- Handles low stock alerts
- Status: **Created and ready**

✅ **backend/models/index.js** - Model registry
- Imports StockLog and Notification models
- Defines associations
- Status: **Updated and ready**

**Note:** Sequelize models will work automatically once the database tables exist. No additional configuration needed.

---

## Testing After Migration

Once the table is created, test the setup:

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ Database connection established successfully
🚀 Server running on port 5000 in development mode
```

### 2. Test Inventory Endpoints

**Get inventory list:**
```bash
curl -X GET "http://localhost:5000/api/inventory" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Increase stock:**
```bash
curl -X PATCH "http://localhost:5000/api/inventory/PRODUCT_ID/increase" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 50, "reason": "Test restock"}'
```

**View stock history:**
```bash
curl -X GET "http://localhost:5000/api/inventory/PRODUCT_ID/history" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Verify Data in Database

```sql
-- After testing API, check if logs were created
SELECT * FROM stock_logs ORDER BY changed_at DESC LIMIT 10;

-- Check notifications for low stock alerts
SELECT * FROM notifications WHERE type = 'low_stock_alert' ORDER BY created_at DESC LIMIT 10;
```

---

## Rollback (If Needed)

To remove the inventory management feature:

```sql
-- Drop stock_logs table
DROP TABLE IF EXISTS stock_logs;

-- Optional: Remove low stock notifications
DELETE FROM notifications WHERE type = 'low_stock_alert';
```

**Note:** This will delete all stock history data permanently!

---

## Common Issues & Solutions

### Issue 1: Table Already Exists
```
Error: Table 'stock_logs' already exists
```
**Solution:** Table is already created. Run verification queries instead.

### Issue 2: Foreign Key Constraint Fails
```
Error: Cannot add foreign key constraint
```
**Solution:** Ensure parent tables exist:
```sql
SHOW TABLES LIKE 'products';
SHOW TABLES LIKE 'manufacturers';
SHOW TABLES LIKE 'users';
```

### Issue 3: UUID() Function Not Working
```
Error: FUNCTION UUID does not exist
```
**Solution:** Your MySQL version might not support UUID(). Use:
```sql
id CHAR(36) PRIMARY KEY,
-- Then generate UUIDs in application code
```

---

## Migration Checklist

Before deploying to production:

- [ ] Backup existing database
- [ ] Run migration on development environment first
- [ ] Verify all tables created successfully
- [ ] Test all API endpoints
- [ ] Check backend server logs for errors
- [ ] Test frontend pages
- [ ] Verify notifications work
- [ ] Check stock operations create logs
- [ ] Test low stock alerts trigger correctly
- [ ] Verify data isolation (manufacturers see only their data)

---

## Summary

**Database Changes:**
- ✅ `notifications` table - Already exists (no action needed)
- ✅ `products` table - Already has inventory fields (no action needed)
- 🆕 `stock_logs` table - **NEEDS TO BE CREATED** (run Option 1 SQL above)

**Backend Changes:**
- ✅ Models created (stockLog.js, notification.js)
- ✅ Routes registered (inventory.js, notifications.js)
- ✅ Services implemented (notificationService.js)
- ✅ All ready to use once table exists

**Action Required:**
Run the SQL in "Option 1: Create Single Table" section above to create the `stock_logs` table.

---

**Last Updated:** 2026-06-14  
**Migration Version:** 1.0.0
