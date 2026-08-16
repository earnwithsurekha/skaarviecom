# Inventory Management Feature - Documentation

## Overview
The Inventory Management system provides manufacturers with comprehensive tools to track, manage, and monitor product stock levels. It includes real-time stock updates, low stock alerts, complete audit trails, and automated notifications.

## Features

### 1. Stock Management
- **Increase Stock**: Add inventory with reasons and notes
- **Decrease Stock**: Remove inventory with validation
- **Update Stock**: Set specific stock levels
- **Threshold Management**: Configure low stock alert thresholds

### 2. Stock History & Audit Trail
- Complete history of all stock changes
- Track who made changes and when
- Filter by change type and date range
- Detailed notes and reasons for each change

### 3. Low Stock Alerts
- Automatic notifications when stock falls below threshold
- Dashboard widget showing low stock products
- Duplicate prevention (no spam within 24 hours)
- Priority levels (urgent, high, normal)

### 4. Inventory Dashboard
- Real-time stock status for all products
- Search and filter capabilities
- Sort by name, stock level, sales, or date
- Visual stock status indicators
- Quick actions for stock operations

## Backend API Endpoints

### Inventory Routes (`/api/inventory`)

#### 1. List Inventory
```http
GET /api/inventory
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by product name/SKU
- `low_stock_only`: Filter low stock products (boolean)
- `category`: Filter by category ID
- `sort_by`: Sort field (name, stock_quantity, sales_count, created_at)
- `sort_order`: Sort order (asc, desc)

**Response:**
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Product Name",
        "sku": "SKU123",
        "currentStock": 100,
        "availableStock": 90,
        "reservedStock": 10,
        "soldStock": 50,
        "low_stock_threshold": 20,
        "stockStatus": "in_stock",
        "stockValue": 10000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

#### 2. Get Product Stock Details
```http
GET /api/inventory/:productId
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "product": {
      "id": "uuid",
      "name": "Product Name",
      "stock_quantity": 100,
      "low_stock_threshold": 20,
      "sales_count": 50
    }
  }
}
```

#### 3. Increase Stock
```http
PATCH /api/inventory/:productId/increase
```

**Body:**
```json
{
  "quantity": 50,
  "reason": "Restocked from supplier",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "product": { ... },
    "stockLog": { ... },
    "message": "Stock increased successfully"
  }
}
```

#### 4. Decrease Stock
```http
PATCH /api/inventory/:productId/decrease
```

**Body:**
```json
{
  "quantity": 10,
  "reason": "Damaged items",
  "notes": "Optional notes"
}
```

#### 5. Update Stock
```http
PATCH /api/inventory/:productId/update
```

**Body:**
```json
{
  "newStock": 75,
  "reason": "Inventory reconciliation",
  "notes": "Optional notes"
}
```

#### 6. Update Threshold
```http
PATCH /api/inventory/:productId/threshold
```

**Body:**
```json
{
  "threshold": 30
}
```

#### 7. Get Stock History
```http
GET /api/inventory/:productId/history
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `change_type`: Filter by type (increase, decrease, update, order_placed, order_cancelled, adjustment)
- `start_date`: Filter from date (YYYY-MM-DD)
- `end_date`: Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "status": "success",
  "data": {
    "history": [
      {
        "id": "uuid",
        "change_type": "increase",
        "quantity_change": 50,
        "previous_stock": 50,
        "new_stock": 100,
        "reason": "Restocked",
        "notes": "From supplier ABC",
        "changed_at": "2026-06-14T10:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### Notification Routes (`/api/notifications`)

#### 1. List Notifications
```http
GET /api/notifications
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by type (low_stock_alert, order_update, etc.)
- `is_read`: Filter by read status (boolean)
- `priority`: Filter by priority (urgent, high, normal, low)

#### 2. Get Unread Count
```http
GET /api/notifications/unread/count
```

#### 3. Mark as Read
```http
PATCH /api/notifications/:id/read
```

#### 4. Mark All as Read
```http
POST /api/notifications/read-all
```

#### 5. Delete Notification
```http
DELETE /api/notifications/:id
```

## Frontend Pages

### 1. Inventory Dashboard
**Path:** `/manufacturer/inventory`

**Features:**
- Product list with stock details
- Search and filter controls
- Sort options
- Stock status badges
- Quick actions (Increase, Decrease, Update, View History)
- Pagination

### 2. Stock History
**Path:** `/manufacturer/inventory/:productId/history`

**Features:**
- Timeline view of all stock changes
- Filter by change type and date range
- Visual change indicators
- Detailed change information
- Pagination

### 3. Dashboard Integration
**Path:** `/manufacturer/dashboard`

**New Features:**
- Notification bell in header
- Low stock alerts widget
- Quick links to inventory management

## Frontend Components

### 1. NotificationBell
**Location:** `/components/NotificationBell.js`

**Features:**
- Real-time unread count badge
- Dropdown with recent notifications
- Click to mark as read
- Navigate to relevant pages
- Priority color indicators
- Auto-refresh every 30 seconds

## Redux State Management

### Inventory Slice
**Location:** `/store/slices/inventorySlice.js`

**Actions:**
- `fetchInventory`: Get product list
- `fetchProductStock`: Get single product details
- `fetchStockHistory`: Get stock change history
- `increaseStock`: Add stock
- `decreaseStock`: Remove stock
- `updateStock`: Set stock level
- `updateThreshold`: Update alert threshold

**State:**
```javascript
{
  products: [],
  selectedProduct: null,
  stockHistory: {},
  pagination: { ... },
  filters: { ... },
  loading: false,
  actionLoading: false,
  error: null
}
```

### Notification Slice (Enhanced)
**Location:** `/store/slices/notificationSlice.js`

**Actions:**
- `fetchNotifications`: Get notification list
- `fetchUnreadCount`: Get unread count
- `markNotificationAsRead`: Mark single as read
- `markAllNotificationsAsRead`: Mark all as read
- `deleteNotification`: Delete notification

## Database Schema

### Stock Logs Table
```sql
CREATE TABLE stock_logs (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    manufacturer_id CHAR(36) NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    quantity_change INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    changed_by CHAR(36),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Indexes for performance
    INDEX idx_product (product_id),
    INDEX idx_manufacturer (manufacturer_id),
    INDEX idx_date (changed_at DESC),
    INDEX idx_type (change_type)
);
```

### Notifications Table
Table already exists - used for low stock alerts with type='low_stock_alert'.

## Usage Examples

### 1. Increase Stock
```javascript
// Using Redux
import { useDispatch } from 'react-redux';
import { increaseStock } from '@/store/slices/inventorySlice';

const handleIncrease = async () => {
  await dispatch(increaseStock({
    productId: 'uuid',
    quantity: 50,
    reason: 'Restocked',
    notes: 'From supplier'
  }));
};
```

### 2. Fetch Low Stock Products
```javascript
// Direct API call
const response = await fetch('/api/inventory?low_stock_only=true&limit=10');
const data = await response.json();
```

### 3. Get Unread Notifications
```javascript
// Using Redux
import { useDispatch } from 'react-redux';
import { fetchUnreadCount } from '@/store/slices/notificationSlice';

useEffect(() => {
  dispatch(fetchUnreadCount());
}, []);
```

## Stock Status Calculation

- **In Stock**: `availableStock > threshold`
- **Low Stock**: `0 < availableStock <= threshold`
- **Out of Stock**: `availableStock = 0`

## Low Stock Alert Logic

1. Alert triggered when: `newStock <= threshold`
2. Duplicate prevention: Check for existing alert within 24 hours
3. Priority assignment:
   - Urgent: Out of stock (stock = 0)
   - High: Low stock (0 < stock <= threshold)
4. Data stored in notification:
   ```json
   {
     "productId": "uuid",
     "productName": "Product Name",
     "currentStock": 5,
     "threshold": 20
   }
   ```

## Security

- All endpoints require authentication (JWT token)
- Manufacturer-only access enforced
- Data isolation: Manufacturers only see their own inventory
- Input validation on all endpoints
- SQL injection protection via Sequelize ORM
- XSS protection via sanitized inputs

## Performance Optimization

- Database indexes on frequently queried fields
- Pagination for large datasets
- Efficient query filters
- Transaction support for data integrity
- Optimized N+1 queries using Sequelize includes

## Error Handling

All endpoints return standardized error responses:
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [ ... ] // Validation errors if applicable
}
```

## Future Enhancements

1. **Bulk Operations**: Update multiple products at once
2. **Export Reports**: Download inventory reports (CSV, Excel)
3. **Barcode Scanning**: Mobile app for quick stock updates
4. **Predictive Alerts**: ML-based stock forecasting
5. **Multi-location**: Track inventory across warehouses
6. **Stock Transfers**: Move inventory between locations
7. **Real-time Sync**: WebSocket for live updates
8. **Advanced Analytics**: Stock turnover, dead stock identification

## Support

For issues or questions:
1. Check error logs in backend console
2. Verify database migrations completed
3. Ensure JWT token is valid
4. Check browser console for frontend errors
5. Review API response status codes

---

**Version:** 1.0.0  
**Last Updated:** 2026-06-14  
**Author:** Skaarvi Development Team
