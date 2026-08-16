# Analytics Feature - Testing Guide

## 🧪 Testing Overview

This guide provides step-by-step instructions for testing the Reseller Demand Analytics feature.

---

## 📋 Prerequisites

1. **Backend Server Running:**
   ```bash
   cd backend
   npm run dev
   ```
   Should be running on `http://localhost:5000`

2. **Frontend Server Running:**
   ```bash
   npm run dev
   ```
   Should be running on `http://localhost:3002` (or 3000)

3. **Database Setup:**
   - MySQL server running on `localhost:3306`
   - Database `skaarvi_resell_db` created
   - Analytics tables created (ProductSave, ProductShare, ProductClick)

4. **Test Accounts:**
   - **Manufacturer:** Email with products in database
   - **Reseller/Customer:** Any email for login

---

## 🔍 Test Cases

### Phase 1: Database & Models ✅

#### Test 1.1: Verify Tables Created
```sql
-- Connect to MySQL
mysql -u root -p

USE skaarvi_resell_db;

-- Check if tables exist
SHOW TABLES LIKE 'product_%';

-- Expected output:
-- product_saves
-- product_shares
-- product_clicks
```

#### Test 1.2: Check Table Structure
```sql
-- Check ProductSave table
DESCRIBE product_saves;

-- Expected columns:
-- id, product_id, user_id, source, device_type, created_at, updated_at

-- Check indexes
SHOW INDEX FROM product_saves;

-- Expected indexes:
-- PRIMARY, product_id, user_id, unique(product_id, user_id), created_at
```

#### Test 1.3: Check Foreign Keys
```sql
-- Check foreign key constraints
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'skaarvi_resell_db'
  AND TABLE_NAME IN ('product_saves', 'product_shares', 'product_clicks')
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

### Phase 2: Backend API Endpoints

#### Test 2.1: Save Product (Authenticated)

**Request:**
```bash
curl -X POST http://localhost:5000/api/analytics/products/1/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "source": "product_page",
    "deviceType": "desktop"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Product saved successfully",
  "data": {
    "productSave": {
      "id": "uuid",
      "productId": 1,
      "userId": "uuid",
      "source": "product_page",
      "deviceType": "desktop",
      "createdAt": "2026-06-14T10:30:00.000Z"
    },
    "alreadySaved": false
  }
}
```

**Verify in Database:**
```sql
SELECT * FROM product_saves ORDER BY created_at DESC LIMIT 1;
```

#### Test 2.2: Save Product Again (Duplicate Check)

**Request:** Same as Test 2.1

**Expected Response:**
```json
{
  "status": "success",
  "message": "Product already saved",
  "data": {
    "productSave": { ... },
    "alreadySaved": true
  }
}
```

#### Test 2.3: Remove Product from Wishlist

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/analytics/products/1/save \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Product removed from wishlist"
}
```

**Verify in Database:**
```sql
-- Should return 0 rows
SELECT * FROM product_saves 
WHERE product_id = 1 AND user_id = 'YOUR_USER_ID';
```

#### Test 2.4: Check Save Status

**Request:**
```bash
curl -X GET http://localhost:5000/api/analytics/products/1/save/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "isSaved": false
  }
}
```

#### Test 2.5: Track Product Share (Anonymous)

**Request:**
```bash
curl -X POST http://localhost:5000/api/analytics/products/1/share \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "whatsapp",
    "source": "product_page",
    "sessionId": "session_test_123",
    "deviceType": "mobile"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Share tracked successfully"
}
```

**Test Different Platforms:**
```bash
# Email
curl -X POST http://localhost:5000/api/analytics/products/1/share \
  -H "Content-Type: application/json" \
  -d '{"platform": "email", "sessionId": "session_test_123"}'

# Copy Link
curl -X POST http://localhost:5000/api/analytics/products/1/share \
  -H "Content-Type: application/json" \
  -d '{"platform": "copy_link", "sessionId": "session_test_123"}'

# Invalid Platform (should fail)
curl -X POST http://localhost:5000/api/analytics/products/1/share \
  -H "Content-Type: application/json" \
  -d '{"platform": "invalid_platform", "sessionId": "session_test_123"}'
```

**Expected Error Response:**
```json
{
  "status": "error",
  "message": "Invalid platform"
}
```

#### Test 2.6: Track Product Click

**Request:**
```bash
curl -X POST http://localhost:5000/api/analytics/products/1/click \
  -H "Content-Type: application/json" \
  -d '{
    "referrer": "https://example.com/products",
    "source": "product_listing",
    "sessionId": "session_test_123",
    "deviceType": "desktop"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Click tracked successfully"
}
```

#### Test 2.7: Get Single Product Analytics (Manufacturer)

**Setup: Add some test data first**
```sql
-- Insert test data (replace UUIDs with actual values)
INSERT INTO product_saves (id, product_id, user_id, source, device_type, created_at, updated_at)
VALUES 
  (UUID(), 1, UUID(), 'product_page', 'mobile', NOW(), NOW()),
  (UUID(), 1, UUID(), 'product_listing', 'desktop', NOW(), NOW()),
  (UUID(), 1, UUID(), 'product_page', 'mobile', NOW(), NOW());

INSERT INTO product_shares (id, product_id, platform, session_id, created_at)
VALUES
  (UUID(), 1, 'whatsapp', 'session_1', NOW()),
  (UUID(), 1, 'whatsapp', 'session_2', NOW()),
  (UUID(), 1, 'email', 'session_3', NOW()),
  (UUID(), 1, 'copy_link', 'session_4', NOW());

INSERT INTO product_clicks (id, product_id, source, session_id, created_at)
VALUES
  (UUID(), 1, 'product_listing', 'session_1', NOW()),
  (UUID(), 1, 'search_results', 'session_2', NOW()),
  (UUID(), 1, 'product_listing', 'session_3', NOW());
```

**Request:**
```bash
curl -X GET "http://localhost:5000/api/manufacturers/products/1/analytics" \
  -H "Authorization: Bearer MANUFACTURER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "productId": 1,
    "productName": "Product Name",
    "totalSaves": 3,
    "uniqueResellers": 3,
    "totalShares": 4,
    "sharesByPlatform": {
      "whatsapp": 2,
      "email": 1,
      "copy_link": 1
    },
    "totalClicks": 3,
    "totalOrders": 0,
    "totalUnitsSold": 0,
    "totalRevenue": 0,
    "conversionRate": 0
  }
}
```

#### Test 2.8: Get Analytics with Date Range

**Request:**
```bash
curl -X GET "http://localhost:5000/api/manufacturers/products/1/analytics?startDate=2026-06-01&endDate=2026-06-14" \
  -H "Authorization: Bearer MANUFACTURER_JWT_TOKEN"
```

**Should return filtered results**

#### Test 2.9: Get Analytics Overview

**Request:**
```bash
curl -X GET "http://localhost:5000/api/manufacturers/analytics/overview?sortBy=saves&limit=10" \
  -H "Authorization: Bearer MANUFACTURER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "productId": 1,
        "productName": "Product Name",
        "sku": "SKU-001",
        "status": "active",
        "saves": 3,
        "shares": 4,
        "clicks": 3,
        "orders": 0,
        "unitsSold": 0,
        "conversionRate": 0
      }
    ],
    "summary": {
      "totalProducts": 1,
      "totalSaves": 3,
      "totalShares": 4,
      "totalClicks": 3,
      "totalOrders": 0,
      "totalUnitsSold": 0,
      "averageConversionRate": 0
    },
    "pagination": {
      "total": 1,
      "showing": 1,
      "sortedBy": "saves"
    }
  }
}
```

---

### Phase 3: Next.js API Proxies

#### Test 3.1: Save Product via Proxy

**Browser Console:**
```javascript
const token = localStorage.getItem('token');

fetch('/api/analytics/products/1/save', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: 'product_page',
    deviceType: 'desktop'
  })
})
.then(r => r.json())
.then(console.log);
```

**Expected:** Same response as backend endpoint

#### Test 3.2: All Proxy Routes

Test each proxy route:
- ✅ POST `/api/analytics/products/:id/save`
- ✅ DELETE `/api/analytics/products/:id/save`
- ✅ GET `/api/analytics/products/:id/save/status`
- ✅ POST `/api/analytics/products/:id/share`
- ✅ POST `/api/analytics/products/:id/click`
- ✅ GET `/api/manufacturers/products/:id/analytics`
- ✅ GET `/api/manufacturers/analytics/overview`

---

### Phase 4: Frontend Components

#### Test 4.1: ProductSaveButton Component

**Manual Test:**
1. Navigate to `/products`
2. Find a product card
3. Click the heart icon (should require login)
4. After login, click heart again
5. Heart should fill with pink color
6. Toast message: "Product saved to wishlist"
7. Reload page
8. Heart should still be filled (state persists)
9. Click heart again
10. Toast message: "Removed from wishlist"
11. Heart should be unfilled

**Console Verification:**
```javascript
// Check API call in Network tab
// Should see POST to /api/analytics/products/:id/save
```

#### Test 4.2: ProductShareButton Component

**Manual Test:**
1. Click share icon on product card
2. Share menu should open with 4 options:
   - WhatsApp (green icon)
   - Email (blue icon)
   - Copy Link (gray icon)
   - QR Code (purple icon)
3. Click WhatsApp → Opens WhatsApp Web
4. Click Email → Opens email client
5. Click Copy Link → Shows "Copied!" message
6. Click outside menu → Menu closes

**Console Verification:**
```javascript
// Check Network tab for each share
// Should see POST to /api/analytics/products/:id/share
// with different platform values
```

#### Test 4.3: ProductCard Component

**Manual Test:**
1. Navigate to `/products`
2. Click anywhere on product card (not on buttons)
3. Should navigate to product detail page
4. Check Network tab → Should see POST to `/api/analytics/products/:id/click`

#### Test 4.4: Product Listing Page

**Manual Test:**
1. Navigate to `/products`
2. Products should load (mock data for now)
3. Test search: Type "wireless" → Results filter
4. Test category filter: Select "Electronics"
5. Test sort: Change to "Price: Low to High"
6. All filters should work together

---

### Phase 5: Analytics Dashboard

#### Test 5.1: Analytics Overview Page

**Manual Test:**
1. Login as manufacturer
2. Navigate to `/manufacturer/analytics`
3. Should see 4 summary cards:
   - Total Saves
   - Total Shares
   - Total Clicks
   - Total Orders
4. Should see conversion rate card
5. Should see products table with:
   - Product name, SKU
   - Saves, Shares, Clicks, Orders
   - Conversion Rate (color-coded)
   - Status badge
   - "View Details" button

**Test Date Range Filter:**
1. Click "Last 7 Days" → Data should update
2. Click "Last 30 Days" → Data should update
3. Click "All Time" → Show all data

**Test Sorting:**
1. Click "Saves" → Table sorts by saves
2. Click "Conversion" → Table sorts by conversion rate
3. Click column headers → Table should sort

#### Test 5.2: Product Detail Analytics

**Manual Test:**
1. From analytics overview, click "View Details" on a product
2. Should navigate to `/manufacturer/products/:id/analytics`
3. Should see:
   - Product name and ID
   - 4 metric cards (Saves, Shares, Clicks, Orders)
   - 3 secondary cards (Unique Resellers, Revenue, Units Sold)
   - Conversion rate hero section
   - Share breakdown by platform (with icons)
4. Test date range filter
5. Click "Back" → Returns to overview

---

### Phase 6: Integration Tests

#### Test 6.1: Complete User Flow (Reseller)

**Steps:**
1. Open incognito browser
2. Navigate to `/products`
3. Click a product card
4. Verify click tracking (Network tab)
5. Click "Back" button
6. Click heart icon → Prompted to login
7. Login as reseller
8. Click heart again → Saved
9. Click share icon
10. Click "Copy Link" → Link copied
11. Verify share tracking (Network tab)
12. Navigate to another product
13. Repeat steps 8-11
14. Check wishlist (if implemented)

#### Test 6.2: Complete User Flow (Manufacturer)

**Steps:**
1. Login as manufacturer
2. Navigate to dashboard
3. Click "Analytics" button
4. Should see overview with data from previous test
5. Verify metrics match database:
   ```sql
   SELECT COUNT(*) FROM product_saves;
   SELECT COUNT(*) FROM product_shares;
   SELECT COUNT(*) FROM product_clicks;
   ```
6. Click on a product
7. Verify detailed analytics
8. Change date range
9. Data should update
10. Export CSV (when implemented)

---

## 🎯 Performance Tests

### Test P1: Dashboard Load Time

**Test:**
1. Create 1000 products in database
2. Add tracking data for each
3. Navigate to `/manufacturer/analytics`
4. Measure time to first render
5. **Target:** < 2 seconds

### Test P2: Query Performance

**SQL Tests:**
```sql
-- Test aggregation query speed
EXPLAIN ANALYZE
SELECT 
  p.id,
  COUNT(DISTINCT ps.id) as saves,
  COUNT(DISTINCT psh.id) as shares,
  COUNT(DISTINCT pc.id) as clicks
FROM products p
LEFT JOIN product_saves ps ON p.id = ps.product_id
LEFT JOIN product_shares psh ON p.id = psh.product_id
LEFT JOIN product_clicks pc ON p.id = pc.product_id
GROUP BY p.id;

-- Should use indexes
-- Execution time < 100ms for 1000 products
```

### Test P3: Click Tracking Latency

**Test:**
```javascript
const startTime = performance.now();

await trackProductClick(productId, 'product_listing');

const endTime = performance.now();
console.log(`Tracking took ${endTime - startTime}ms`);

// Target: < 50ms
```

---

## 🐛 Error Scenarios

### Test E1: Unauthorized Access

**Test:**
```bash
# Try to save without token
curl -X POST http://localhost:5000/api/analytics/products/1/save \
  -H "Content-Type: application/json" \
  -d '{"source": "product_page"}'
```

**Expected:**
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Test E2: Invalid Product ID

**Test:**
```bash
curl -X POST http://localhost:5000/api/analytics/products/99999/save \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "product_page"}'
```

**Expected:**
```json
{
  "status": "error",
  "message": "Product not found"
}
```

### Test E3: Invalid Share Platform

**Test:**
```bash
curl -X POST http://localhost:5000/api/analytics/products/1/share \
  -H "Content-Type: application/json" \
  -d '{"platform": "invalid"}'
```

**Expected:**
```json
{
  "status": "error",
  "message": "Invalid platform"
}
```

### Test E4: Manufacturer Accessing Another's Products

**Test:**
```bash
# Manufacturer A tries to view Manufacturer B's product analytics
curl -X GET http://localhost:5000/api/manufacturers/products/999/analytics \
  -H "Authorization: Bearer MANUFACTURER_A_TOKEN"
```

**Expected:**
```json
{
  "status": "error",
  "message": "Product not found or access denied"
}
```

---

## ✅ Test Results Template

```
Feature: Reseller Demand Analytics
Test Date: 2026-06-14
Tester: [Your Name]

PHASE 1: DATABASE & MODELS
[✓] Test 1.1: Tables Created
[✓] Test 1.2: Table Structure
[✓] Test 1.3: Foreign Keys

PHASE 2: BACKEND API
[✓] Test 2.1: Save Product
[✓] Test 2.2: Duplicate Check
[✓] Test 2.3: Remove Product
[✓] Test 2.4: Check Status
[✓] Test 2.5: Track Share
[✓] Test 2.6: Track Click
[✓] Test 2.7: Product Analytics
[✓] Test 2.8: Date Range Filter
[✓] Test 2.9: Analytics Overview

PHASE 3: API PROXIES
[✓] Test 3.1: Save via Proxy
[✓] Test 3.2: All Proxies

PHASE 4: FRONTEND COMPONENTS
[✓] Test 4.1: SaveButton
[✓] Test 4.2: ShareButton
[✓] Test 4.3: ProductCard
[✓] Test 4.4: Product Listing

PHASE 5: ANALYTICS DASHBOARD
[✓] Test 5.1: Overview Page
[✓] Test 5.2: Product Detail

PHASE 6: INTEGRATION
[✓] Test 6.1: Reseller Flow
[✓] Test 6.2: Manufacturer Flow

PERFORMANCE
[✓] Test P1: Dashboard Load
[✓] Test P2: Query Performance
[✓] Test P3: Tracking Latency

ERROR SCENARIOS
[✓] Test E1: Unauthorized
[✓] Test E2: Invalid Product
[✓] Test E3: Invalid Platform
[✓] Test E4: Access Control

OVERALL RESULT: ✅ PASS / ❌ FAIL

NOTES:
- All tests passed successfully
- Dashboard loads in 1.2s with 500 products
- Click tracking adds < 30ms latency
- No errors in console
```

---

## 🔄 Continuous Testing

### Automated Tests (To Implement)

**Backend Tests** (`backend/tests/analytics.test.js`):
```javascript
describe('Analytics API', () => {
  test('POST /api/analytics/products/:id/save', async () => {
    // Test implementation
  });
  
  test('GET /api/manufacturers/products/:id/analytics', async () => {
    // Test implementation
  });
});
```

**Frontend Tests** (`__tests__/components/ProductSaveButton.test.js`):
```javascript
import { render, fireEvent, waitFor } from '@testing-library/react';
import ProductSaveButton from '@/components/product/ProductSaveButton';

describe('ProductSaveButton', () => {
  test('saves product on click', async () => {
    // Test implementation
  });
});
```

---

## 📊 Success Criteria

Feature is considered fully tested and ready for production when:

- ✅ All 35+ test cases pass
- ✅ No console errors in any flow
- ✅ Dashboard loads in < 2 seconds
- ✅ Tracking adds < 50ms latency
- ✅ Works in Chrome, Firefox, Safari
- ✅ Works on mobile devices
- ✅ Error handling works correctly
- ✅ Analytics data is accurate
- ✅ No security vulnerabilities

---

**Happy Testing!** 🎉
