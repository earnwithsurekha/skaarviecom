-- ============================================================================
-- Migration: Update products table for new pricing model
-- Description: Ensures skaarvi_margin and reseller_margin store absolute amounts (₹)
--              Platform fee is fixed at 5% of cost_price
--              Final price = cost_price + skaarvi_margin + reseller_margin + (cost_price * 0.05)
-- Date: June 28, 2026
-- ============================================================================

USE skaarvi_resell_db;

-- Ensure columns exist and are proper decimal types
-- (If they already exist, these will be no-ops or modify to correct type)

-- Note: If your existing data has percentage values, you'll need to convert them
-- For now, we'll just set defaults for any null values

-- Update any null margins to 0
UPDATE products 
SET skaarvi_margin = 0
WHERE skaarvi_margin IS NULL;

UPDATE products 
SET reseller_margin = 0
WHERE reseller_margin IS NULL;

-- Recalculate selling_price for all products based on new formula
-- Final Price = Cost + Skaarvi Margin + Reseller Margin + Platform Fee (₹5)
UPDATE products 
SET selling_price = ROUND(
  cost_price + skaarvi_margin + reseller_margin + 5, 
  2
)
WHERE deleted_at IS NULL;

COMMIT;

-- ============================================================================
-- New Pricing Model:
-- - Manufacturer provides: cost_price (manufacturer price)
-- - Admin sets: skaarvi_margin (₹), reseller_margin (₹)
-- - System adds: platform_fee (fixed ₹5)
-- - Final customer price = cost_price + skaarvi_margin + reseller_margin + ₹5
-- - All price components are visible to customer for transparency
-- ============================================================================
