# Skaarvi Marketplace Backend

Backend API for Skaarvi Resell Marketplace - Manufacturer Panel

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize
- **Authentication**: JWT
- **File Storage**: AWS S3
- **Email**: SendGrid / AWS SES
- **SMS**: Twilio / MSG91
- **WhatsApp**: WhatsApp Business API
- **Cache**: Redis

## Project Structure

```
backend/
├── config/          # Configuration files (database, AWS, constants)
├── controllers/     # Business logic controllers
├── middleware/      # Custom middleware (auth, upload, validation)
├── models/          # Sequelize models
├── routes/          # API route definitions
├── services/        # External service integrations (email, SMS, WhatsApp)
├── utils/           # Utility functions (JWT, validators)
├── .env.example     # Environment variables template
├── package.json     # Dependencies
└── server.js        # Entry point
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
``` 

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Update the following in `.env`:
- Database credentials
- JWT secret
- AWS S3 credentials
- Email/SMS/WhatsApp API keys
- Razorpay credentials

### 3. Database Setup

Make sure PostgreSQL is running and create the database:

```bash
createdb skaarvi_resell_db
```

Run the database schema from the root project:

```bash
psql -U postgres -d skaarvi_resell_db -f ../DATABASE-SCHEMA.sql
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 5. Test API

Visit `http://localhost:5000/health` to check if the server is running.

## API Endpoints

### Authentication
- `POST /api/auth/register-manufacturer` - Register manufacturer
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/refresh-token` - Refresh token
- `POST /api/auth/logout` - Logout

### Manufacturers
- `GET /api/manufacturers/dashboard` - Get dashboard summary
- `GET /api/manufacturers/profile` - Get profile
- `PUT /api/manufacturers/profile` - Update profile
- `GET /api/manufacturers/pending` - Get pending approvals (Admin)
- `POST /api/manufacturers/:id/approve` - Approve manufacturer (Admin)
- `POST /api/manufacturers/:id/reject` - Reject manufacturer (Admin)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/duplicate` - Duplicate product
- `PATCH /api/products/:id/stock` - Update stock

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/accept` - Accept order
- `POST /api/orders/:id/ship` - Mark as shipped
- `POST /api/orders/:id/deliver` - Mark as delivered

### Analytics
- `GET /api/analytics/products/:id/demand` - Get reseller demand analytics
- `GET /api/analytics/sales` - Get sales analytics
- `GET /api/analytics/products/performance` - Get product performance

### Earnings
- `GET /api/earnings/overview` - Get earnings overview
- `GET /api/earnings/products` - Get product-wise earnings
- `GET /api/earnings/settlements` - Get settlement history

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

## API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## File Upload

Product media uploads support:
- **Images**: JPEG, JPG, PNG, WEBP, GIF (max 5MB each, max 10 images)
- **Videos**: MP4, MOV, AVI (max 50MB each, max 3 videos)
- **Catalog**: PDF (max 10MB)

## Rate Limiting

- 100 requests per 15 minutes per IP for `/api/*` endpoints

## Testing

```bash
npm test
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update all production credentials
3. Run: `npm start`

## License

MIT
