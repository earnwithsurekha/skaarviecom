# Reseller Demand Analytics - Implementation Guide

## Overview
The Reseller Demand Analytics feature tracks product engagement metrics to help identify trending products and understand customer behavior. This feature is **ready for testing** but requires database table creation first.

---

## 🎯 Features Implemented

### 1. **Product-Wise Demand Tracking**
- **Total Clicks**: Track every product view/click
- **Total Saves**: Track wishlist additions
- **Total Shares**: Track social sharing activity
- **Total Orders**: Track actual purchases
- **Conversion Rate**: Calculate click-to-order conversion percentage

### 2. **Analytics Dashboard**
- **Stats Cards**: Overview of total clicks, saves, shares, orders, and conversion rate
- **Product Table**: Detailed view of each product's engagement metrics
- **Trending Products Sidebar**: Top 10 trending products based on recent engagement
- **Share Platform Breakdown**: Distribution of shares across platforms (WhatsApp, Facebook, etc.)

### 3. **Advanced Filters**
- **Period Filter**: 7 days, 30 days, 90 days, or all time
- **Sort Options**: Sort by conversion rate, engagement score, trending score, clicks, saves, shares, orders, or revenue
- **Search**: Find products by name
- **Sort Order**: High to low or low to high

### 4. **Engagement Metrics**
- **Engagement Score**: Weighted score combining all interactions
- **Trending Score**: Recent activity (last 7 days) weighted higher
- **Growth Percentage**: Compare last 7 days to previous 7 days
- **Save-to-Order Rate**: Conversion from wishlist to purchase

---

## 📊 Database Tables Required

### ⚠️ IMPORTANT: Run SQL Script First

Before testing the feature, you **MUST** create the tracking tables in your MySQL database.

**Location**: `d:\SKAARVI\skaarvi-reseller\docs\PRODUCT-DEMAND-TRACKING.sql`

**Tables Created**:
1. **product_clicks** - Tracks every product click/view
2. **product_saves** - Tracks wishlist additions/removals
3. **product_shares** - Tracks social media shares

**Run Command**:
```bash
mysql -u root -p skaarvi_resell_db < docs/PRODUCT-DEMAND-TRACKING.sql
```

Or run the SQL directly in your MySQL client.

---

## 🛠️ Implementation Details

### Backend Routes
**File**: `backend/routes/admin/demand-analytics.js`

**Endpoints**:
- `GET /api/admin/demand-analytics` - Main analytics with pagination
  - Query params: `period`, `search`, `page`, `limit`, `sortBy`, `sortOrder`
  
- `GET /api/admin/demand-analytics/trending` - Top trending products
  - Query params: `limit` (default: 10)
  
- `GET /api/admin/demand-analytics/share-breakdown` - Share platform statistics
  - Query params: `period`, `productId` (optional)

**Registered in**: `backend/server.js` (line 83)

### Next.js API Routes (Cookie Extraction)
- `app/api/admin/demand-analytics/route.js` - Main proxy
- `app/api/admin/demand-analytics/trending/route.js` - Trending proxy
- `app/api/admin/demand-analytics/share-breakdown/route.js` - Share breakdown proxy

### Frontend Page
**File**: `app/admin/demand-analytics/page.js`

**Components**:
- Stats cards with total metrics
- Filters panel with period, search, sort options
- Main product table with engagement metrics
- Trending products sidebar
- Share platform breakdown sidebar
- CSV export functionality

**Navigation**: Added to admin sidebar as "Demand Analytics" with TrendingUp icon

### Loading State
**File**: `app/admin/demand-analytics/loading.js`
- Skeleton loader for better UX during data fetch

---

## 🚀 Testing Instructions

### Step 1: Create Database Tables
```bash
cd d:\SKAARVI\skaarvi-reseller
mysql -u root -p skaarvi_resell_db < docs/PRODUCT-DEMAND-TRACKING.sql
```

### Step 2: Verify Servers are Running
- **Backend**: http://localhost:5000 ✅ (Running)
- **Frontend**: http://localhost:3000 (Should auto-reload)

### Step 3: Access the Feature
Navigate to: **http://localhost:3000/admin/demand-analytics**

### Step 4: Generate Test Data (Optional)
The SQL file includes commented-out sample data generators. To enable:
1. Open `docs/PRODUCT-DEMAND-TRACKING.sql`
2. Uncomment the INSERT statements at the bottom
3. Run the file again

---

## 📈 How Metrics Are Calculated

### Conversion Rate
```
(Total Orders / Total Clicks) × 100
```
- **Green badge**: ≥ 5%
- **Yellow badge**: 2-5%
- **Gray badge**: < 2%

### Engagement Score
```
(Clicks × 1) + (Saves × 3) + (Shares × 5) + (Orders × 10)
```
Weighted to prioritize high-value actions.

### Trending Score
```
(Recent Clicks × 1) + (Recent Saves × 3) + (Recent Shares × 5) + (Recent Orders × 10)
```
Only counts last 7 days of activity.

### Growth Percentage
```
((Recent Activity - Previous Activity) / Previous Activity) × 100
```
Compares last 7 days vs previous 7 days.

---

## 🎨 UI Features

### Visual Indicators
- **Product images** displayed in table
- **Color-coded conversion rates** (green/yellow/gray)
- **Icon indicators** for clicks (Eye), saves (Heart), shares (Share2)
- **Trending rankings** with gold/silver/bronze medals
- **Progress bars** for share platform breakdown

### Export Functionality
- **CSV Export** button creates downloadable report
- Includes all metrics for each product
- Filename: `demand-analytics-YYYY-MM-DD.csv`

### Responsive Design
- Grid layout adapts to screen size
- Mobile-friendly table scrolling
- Theme-aware (dark mode support)

---

## 🔗 Integration Points

### How Tracking Works (For Future Implementation)

When you implement the **reseller mobile app** or **customer frontend**, track events by inserting into these tables:

#### Track Product Click
```javascript
POST /api/tracking/click
Body: {
  productId: "uuid",
  userId: "uuid",
  clickSource: "search" // or "category", "featured", etc.
}
```

#### Track Product Save
```javascript
POST /api/tracking/save
Body: {
  productId: "uuid",
  userId: "uuid"
}
```

#### Track Product Share
```javascript
POST /api/tracking/share
Body: {
  productId: "uuid",
  userId: "uuid",
  platform: "whatsapp", // or "facebook", "twitter", etc.
  medium: "social" // or "messaging", "email", "copy_link"
}
```

**Note**: These tracking endpoints are **not yet implemented**. You'll need to create them when building the reseller/customer apps.

---

## 📝 Current Status

### ✅ Completed
- Backend API routes with complex SQL queries
- Next.js API proxies for cookie extraction
- Frontend dashboard with full UI
- Filters, search, sorting, pagination
- Stats cards and trending products
- Share platform breakdown
- CSV export functionality
- Loading states and error handling
- Navigation integration
- Database schema documentation

### ⚠️ Pending
- **Database table creation** (run SQL script)
- **Tracking endpoints** for mobile/web apps
- **Actual tracking data** (currently tables are empty)

### 🧪 Testing
Once tables are created, the page will:
- Show "No data available" (expected - no tracking data yet)
- Display stats cards with all zeros
- Allow period filtering, searching, sorting
- Export empty CSV

---

## 🎯 Next Steps

1. **Create the database tables** using the provided SQL script
2. **Test the analytics page** to verify it loads correctly
3. **Implement tracking endpoints** when building reseller/customer apps
4. **Start collecting real data** as users interact with products
5. **Monitor trending products** to inform inventory and marketing decisions

---

## 📂 File Structure

```
backend/
  routes/admin/
    demand-analytics.js        ← Backend API logic

app/
  admin/
    demand-analytics/
      page.js                  ← Main frontend page
      loading.js               ← Loading skeleton
  api/admin/demand-analytics/
    route.js                   ← Main proxy
    trending/route.js          ← Trending proxy
    share-breakdown/route.js   ← Share breakdown proxy

docs/
  PRODUCT-DEMAND-TRACKING.sql  ← Database schema
  DEMAND-ANALYTICS-GUIDE.md    ← This file
```

---

## 🔧 Configuration

### Backend Configuration
- **Port**: 5000
- **Route prefix**: `/api/admin/demand-analytics`
- **Authentication**: JWT token required
- **Authorization**: Admin role only
- **Database**: MySQL with Sequelize ORM

### Frontend Configuration
- **Port**: 3000
- **Route**: `/admin/demand-analytics`
- **Theme**: Supports light/dark mode
- **Icons**: Lucide React (TrendingUp, Eye, Heart, Share2, etc.)
- **Charts**: None (uses tables and progress bars)

---

## 💡 Tips for Admins

1. **Monitor Conversion Rates**: Products with high clicks but low orders may have pricing issues
2. **Identify Trending Products**: Stock up on products with high trending scores
3. **Track Share Platforms**: Focus marketing efforts on most popular platforms
4. **Compare Periods**: Use 7d/30d/90d filters to spot seasonal trends
5. **Export Reports**: Download CSV for deeper analysis in Excel

---

## 🐛 Troubleshooting

### "No data available"
- **Cause**: Tracking tables are empty
- **Solution**: Wait for user activity or insert test data

### "Failed to load demand analytics"
- **Cause**: Backend not running or database error
- **Solution**: Check backend logs and database connection

### Tables not found error
- **Cause**: SQL script not run
- **Solution**: Run `PRODUCT-DEMAND-TRACKING.sql` in MySQL

### Unauthorized error
- **Cause**: Not logged in as admin
- **Solution**: Login with admin credentials

---

## ✨ Feature Highlights

- **Zero Configuration**: Works out of the box after table creation
- **Real-Time**: Shows latest data on every page load
- **Scalable**: Handles large datasets with pagination
- **Performant**: Optimized SQL queries with proper indexing
- **Flexible**: Multiple sort and filter options
- **Exportable**: CSV download for external analysis
- **Responsive**: Works on desktop, tablet, and mobile
- **Theme-Aware**: Respects user's dark/light mode preference

---

**Created**: June 20, 2026  
**Status**: Implementation Complete, Ready for Testing  
**Version**: 1.0
