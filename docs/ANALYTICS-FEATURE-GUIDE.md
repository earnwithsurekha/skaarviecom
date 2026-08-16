# Reseller Demand Analytics - Feature Guide

## 📊 Overview

The Reseller Demand Analytics feature allows manufacturers to track how resellers interact with their products, providing valuable insights into product demand, social sharing, and conversion rates.

---

## 🎯 Key Features

### For Manufacturers:
- **Product Saves Tracking** - See how many resellers saved each product to their wishlist
- **Share Analytics** - Track shares across WhatsApp, Email, Copy Link, and QR Code
- **Click Tracking** - Monitor product page views and link clicks
- **Conversion Metrics** - Calculate conversion rate from clicks to orders
- **Revenue Analytics** - View total revenue and units sold per product
- **Trend Analysis** - Filter data by date ranges (7/30/90 days, All Time)
- **Performance Rankings** - Sort products by saves, shares, clicks, orders, or conversion rate

### For Resellers/Customers:
- **Save Products** - Heart button to save products to wishlist
- **Share Products** - Multi-platform sharing (WhatsApp, Email, Copy Link, QR Code)
- **Anonymous Tracking** - Share and click tracking works without login
- **Seamless Experience** - All tracking happens in background without disrupting UX

---

## 🗄️ Database Schema

### Tables Created:

#### 1. `product_saves`
Tracks when resellers save products to their wishlist.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Foreign key to products table |
| user_id | UUID | Foreign key to users table |
| source | VARCHAR | Where save happened (product_page, listing, etc.) |
| device_type | VARCHAR | mobile, tablet, desktop |
| created_at | TIMESTAMP | When saved |
| updated_at | TIMESTAMP | Last updated |

**Indexes:**
- `product_id` (for aggregation queries)
- `user_id` (for user wishlist queries)
- `created_at` (for date range filtering)
- Unique constraint on `(product_id, user_id)` to prevent duplicates

#### 2. `product_shares`
Tracks product shares across platforms.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Foreign key to products table |
| user_id | UUID | Foreign key to users table (nullable) |
| platform | ENUM | whatsapp, email, facebook, twitter, copy_link, qr_code |
| source | VARCHAR | Where share happened |
| session_id | VARCHAR | For anonymous tracking |
| ip_address | VARCHAR | For analytics |
| device_type | VARCHAR | mobile, tablet, desktop |
| created_at | TIMESTAMP | When shared |

**Indexes:**
- `product_id` (for aggregation)
- `platform` (for platform breakdown)
- `created_at` (for trends)

#### 3. `product_clicks`
Tracks product link clicks and page views.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Foreign key to products table |
| user_id | UUID | Foreign key to users table (nullable) |
| referrer | TEXT | Where click came from |
| source | VARCHAR | Tracking source |
| session_id | VARCHAR | For anonymous tracking |
| ip_address | VARCHAR | For analytics |
| user_agent | TEXT | Browser/device info |
| device_type | VARCHAR | mobile, tablet, desktop |
| country | VARCHAR | Geolocation (future) |
| city | VARCHAR | Geolocation (future) |
| created_at | TIMESTAMP | When clicked |

**Indexes:**
- `product_id` (for aggregation)
- `session_id` (for session tracking)
- `created_at` (for trends)
- Composite index on `(product_id, created_at)` for optimized queries

---

## 🔌 API Endpoints

### Reseller/Customer Tracking Endpoints

#### 1. Save Product to Wishlist
```http
POST /api/analytics/products/:id/save
Authorization: Bearer {token}
Content-Type: application/json

{
  "source": "product_page",
  "deviceType": "mobile"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Product saved successfully",
  "data": {
    "productSave": {
      "id": "uuid",
      "productId": "uuid",
      "userId": "uuid",
      "createdAt": "2026-06-14T10:30:00Z"
    },
    "alreadySaved": false
  }
}
```

#### 2. Remove Product from Wishlist
```http
DELETE /api/analytics/products/:id/save
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "message": "Product removed from wishlist"
}
```

#### 3. Check Save Status
```http
GET /api/analytics/products/:id/save/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "isSaved": true
  }
}
```

#### 4. Track Product Share
```http
POST /api/analytics/products/:id/share
Content-Type: application/json

{
  "platform": "whatsapp",
  "source": "product_page",
  "sessionId": "session_123456",
  "deviceType": "mobile"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Share tracked successfully"
}
```

#### 5. Track Product Click
```http
POST /api/analytics/products/:id/click
Content-Type: application/json

{
  "referrer": "https://example.com/products",
  "source": "product_listing",
  "sessionId": "session_123456",
  "deviceType": "desktop"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Click tracked successfully"
}
```

### Manufacturer Analytics Endpoints

#### 6. Get Single Product Analytics
```http
GET /api/manufacturers/products/:id/analytics?startDate=2026-01-01&endDate=2026-06-14
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "productId": "uuid",
    "productName": "Premium Wireless Headphones",
    "totalSaves": 125,
    "uniqueResellers": 98,
    "totalShares": 87,
    "sharesByPlatform": {
      "whatsapp": 45,
      "email": 12,
      "copy_link": 25,
      "qr_code": 5
    },
    "totalClicks": 1543,
    "totalOrders": 78,
    "totalUnitsSold": 156,
    "totalRevenue": 467844,
    "conversionRate": 5.05
  }
}
```

#### 7. Get Analytics Overview
```http
GET /api/manufacturers/analytics/overview?sortBy=saves&limit=50&startDate=2026-01-01
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "productId": "uuid",
        "productName": "Product Name",
        "sku": "SKU-123",
        "status": "active",
        "saves": 125,
        "shares": 87,
        "clicks": 1543,
        "orders": 78,
        "unitsSold": 156,
        "conversionRate": 5.05
      }
    ],
    "summary": {
      "totalProducts": 45,
      "totalSaves": 3421,
      "totalShares": 2198,
      "totalClicks": 45678,
      "totalOrders": 2345,
      "totalUnitsSold": 5678,
      "averageConversionRate": 5.13
    },
    "pagination": {
      "total": 45,
      "showing": 45,
      "sortedBy": "saves"
    }
  }
}
```

---

## 🎨 Frontend Components

### 1. ProductSaveButton
**Location:** `components/product/ProductSaveButton.js`

**Usage:**
```jsx
import ProductSaveButton from '@/components/product/ProductSaveButton';

<ProductSaveButton 
  productId="uuid"
  initialSaved={false}
  source="product_page"
  onSaveChange={(isSaved) => console.log('Saved:', isSaved)}
/>
```

**Features:**
- Heart icon with fill animation
- Auto-checks save status on mount
- Requires authentication
- Shows loading states
- Toast notifications

### 2. ProductShareButton
**Location:** `components/product/ProductShareButton.js`

**Usage:**
```jsx
import ProductShareButton from '@/components/product/ProductShareButton';

<ProductShareButton
  productId="uuid"
  productName="Product Name"
  productImage="https://..."
  productUrl="https://..."
  source="product_page"
/>
```

**Features:**
- Dropdown menu with share options
- WhatsApp direct share
- Email share (mailto)
- Copy link to clipboard
- QR code (placeholder)
- Tracks each share by platform

### 3. ProductCard
**Location:** `components/product/ProductCard.js`

**Usage:**
```jsx
import ProductCard from '@/components/product/ProductCard';

<ProductCard 
  product={productData}
  source="product_listing"
/>
```

**Features:**
- Integrated save & share buttons
- Auto-tracks clicks
- Shows pricing, discounts, stock
- Hover animations

### 4. AnalyticsCard
**Location:** `components/manufacturer/analytics/AnalyticsCard.js`

**Usage:**
```jsx
import AnalyticsCard from '@/components/manufacturer/analytics/AnalyticsCard';
import { Heart } from 'lucide-react';

<AnalyticsCard
  title="Total Saves"
  value={3421}
  icon={Heart}
  trend="up"
  trendValue={12.5}
  subtitle="Across all products"
  colorClass="text-pink-600 dark:text-pink-400"
/>
```

### 5. AnalyticsTable
**Location:** `components/manufacturer/analytics/AnalyticsTable.js`

**Usage:**
```jsx
import AnalyticsTable from '@/components/manufacturer/analytics/AnalyticsTable';

<AnalyticsTable 
  products={productsData}
  currentSort="saves"
  onSort={(field) => handleSort(field)}
/>
```

---

## 📱 Pages

### 1. Product Listing Page
**URL:** `/products`  
**File:** `app/products/page.js`

**Features:**
- Search products
- Filter by category
- Sort options
- Product grid with tracking
- Save & share buttons on each card

### 2. Analytics Overview
**URL:** `/manufacturer/analytics`  
**File:** `app/manufacturer/analytics/page.js`

**Features:**
- Summary cards (saves, shares, clicks, orders)
- Average conversion rate display
- Date range filtering
- Sortable products table
- Export CSV button (ready for implementation)

### 3. Product Analytics Detail
**URL:** `/manufacturer/products/:id/analytics`  
**File:** `app/manufacturer/products/[id]/analytics/page.js`

**Features:**
- Detailed metrics for single product
- Share breakdown by platform
- Conversion funnel visualization
- Revenue and units sold
- Date range filtering

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] ProductSaveButton save/unsave functionality
- [ ] ProductShareButton share tracking
- [ ] Product click tracking utility
- [ ] Analytics API response parsing

### Integration Tests
- [ ] Save product flow (authenticated)
- [ ] Share product flow (anonymous)
- [ ] Click tracking on navigation
- [ ] Analytics aggregation accuracy
- [ ] Date range filtering

### Manual Testing
- [ ] Save button state persistence across page reloads
- [ ] Share menu opens and closes correctly
- [ ] WhatsApp share opens with correct text
- [ ] Copy link shows success message
- [ ] Analytics dashboard loads correctly
- [ ] Product detail analytics shows correct data
- [ ] Sorting products works correctly
- [ ] Date range filter updates data

### Performance Tests
- [ ] Analytics aggregation query speed
- [ ] Dashboard load time with 1000+ products
- [ ] Click tracking doesn't delay navigation
- [ ] Share tracking completes quickly

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🚀 Deployment Checklist

### Database
- [ ] Run migrations to create analytics tables
- [ ] Create indexes for performance
- [ ] Set up foreign key constraints
- [ ] Verify CASCADE delete on Product deletion

### Backend
- [ ] Deploy analytics routes to production
- [ ] Update manufacturers routes
- [ ] Verify JWT authentication works
- [ ] Test API endpoints with production data

### Frontend
- [ ] Deploy Next.js app with new pages
- [ ] Verify API proxy routes work
- [ ] Test tracking in production environment
- [ ] Enable anonymous tracking

### Monitoring
- [ ] Set up logging for tracking endpoints
- [ ] Monitor API response times
- [ ] Track error rates
- [ ] Set up alerts for failures

---

## 📈 Usage Examples

### Example 1: Track Product Click from Listing
```javascript
import { trackProductClick } from '@/lib/productTracking';

const handleProductClick = async (productId) => {
  await trackProductClick(productId, 'product_listing');
  router.push(`/products/${productId}`);
};
```

### Example 2: Check if Product is Saved
```javascript
const [isSaved, setIsSaved] = useState(false);

useEffect(() => {
  const checkStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const response = await fetch(`/api/analytics/products/${productId}/save/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    setIsSaved(result.data.isSaved);
  };
  
  checkStatus();
}, [productId]);
```

### Example 3: Fetch Product Analytics
```javascript
const fetchAnalytics = async (productId, dateRange = 'all') => {
  const params = new URLSearchParams();
  
  if (dateRange !== 'all') {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    
    params.append('startDate', startDate.toISOString().split('T')[0]);
    params.append('endDate', endDate.toISOString().split('T')[0]);
  }
  
  const response = await fetch(
    `/api/manufacturers/products/${productId}/analytics?${params}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  return await response.json();
};
```

---

## 🔒 Security Considerations

1. **Authentication**
   - Save/unsave requires valid JWT token
   - Anonymous tracking only for shares and clicks
   - User ID validated against JWT claims

2. **Rate Limiting**
   - Consider implementing rate limiting on tracking endpoints
   - Prevent spam tracking from bots

3. **Data Privacy**
   - IP addresses stored for analytics (anonymize if needed)
   - Session IDs generated client-side (not personally identifiable)
   - Comply with GDPR/privacy regulations

4. **Authorization**
   - Manufacturers can only view analytics for their own products
   - Product ownership verified before returning analytics data

---

## 🎓 Training Guide

### For Manufacturers

**Accessing Analytics:**
1. Login to manufacturer dashboard
2. Click "Analytics" button in header
3. View overview of all products

**Understanding Metrics:**
- **Saves:** Number of resellers who saved product to wishlist (indicates interest)
- **Shares:** How many times product was shared (social proof)
- **Clicks:** Product page views (traffic)
- **Orders:** Actual purchases (conversion)
- **Conversion Rate:** Orders ÷ Clicks × 100 (efficiency metric)

**Best Practices:**
- Check analytics weekly to identify trends
- Focus marketing on high-save, low-order products (demand exists but not converting)
- Promote products with high share counts (social proof)
- Investigate low click-through products (improve images/descriptions)

### For Resellers

**Using Save Feature:**
1. Browse products at `/products`
2. Click heart icon on product card
3. Login if prompted
4. Product saved to your wishlist

**Sharing Products:**
1. Click share icon on product card
2. Choose platform (WhatsApp, Email, Copy Link)
3. Share opens in new window or copies link
4. Your shares help manufacturers understand product interest

---

## 🐛 Troubleshooting

### Issue: Save button not working
**Solution:** Verify user is logged in, check token in localStorage, check network tab for API errors

### Issue: Analytics showing 0 for all metrics
**Solution:** Ensure tracking components are integrated on product pages, check if data exists in database

### Issue: Share tracking not recording
**Solution:** Check browser console for errors, verify API proxy routes are deployed, check sessionId generation

### Issue: Conversion rate always 0%
**Solution:** Ensure OrderItems table has productId field, verify order data exists, check JOIN queries

---

## 📞 Support

For issues or questions:
- Check backend logs: `npm run dev` in backend folder
- Check frontend logs: Browser console (F12)
- Review API responses in Network tab
- Verify database tables were created correctly

---

## 🎉 Congratulations!

You've successfully implemented the Reseller Demand Analytics feature! This powerful tool will help manufacturers make data-driven decisions and optimize their product offerings based on real reseller demand.
