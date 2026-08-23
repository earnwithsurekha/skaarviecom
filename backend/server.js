const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { sessionTimeoutMiddleware } = require('./middleware/sessionTimeout');

const app = express();

// Security middleware with relaxed CSP for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP to allow image loading from backend
}));

// CORS - Allow all origins (temporary for development)
app.use(cors({
  origin: '*',
  credentials: false // Must be false when origin is *
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { status: 'error', message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting only to auth endpoints (excluding registration)
app.use('/api/auth/login', limiter);
app.use('/api/auth/logout', limiter);
// Registration rate limiting removed for development/testing
// const registrationLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 5, // 5 registrations per hour per IP
//   message: { status: 'error', message: 'Too many registration attempts, please try again later.' },
// });
// app.use('/api/auth/register', registrationLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session timeout middleware (applies to all routes except /auth)
app.use(sessionTimeoutMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API health check endpoint (for ALB)
app.use('/api/health', require('./routes/health'));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/manufacturers', require('./routes/manufacturers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/earnings', require('./routes/earnings'));
app.use('/api/settlements', require('./routes/settlements'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

// Admin Routes
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));
app.use('/api/admin/products', require('./routes/admin/products'));
app.use('/api/admin/settings', require('./routes/admin/settings'));
app.use('/api/admin/withdrawals', require('./routes/admin/withdrawals'));
app.use('/api/admin/wallets', require('./routes/admin/wallets'));
app.use('/api/admin/settlements', require('./routes/admin/settlements'));
app.use('/api/admin/orders', require('./routes/admin/orders'));
app.use('/api/admin/returns', require('./routes/admin/returns'));
app.use('/api/admin/manufacturers', require('./routes/admin/manufacturers'));
app.use('/api/admin/resellers', require('./routes/admin/resellers'));
app.use('/api/admin/categories', require('./routes/admin/categories'));
app.use('/api/admin/reports', require('./routes/admin/reports'));
app.use('/api/admin/referrals', require('./routes/admin/referrals'));
app.use('/api/admin/demand-analytics', require('./routes/admin/demand-analytics'));
app.use('/api/admin/banners', require('./routes/admin/banners'));
app.use('/api/admin', require('./routes/admin/reseller-upgrades'));

// Customer Routes
app.use('/api/customer', require('./routes/customer/reseller-upgrade'));
app.use('/api/customer', require('./routes/customer/check-access'));

// Reseller Routes (with authentication)
const { authMiddleware } = require('./middleware/auth');
app.use('/api/reseller', authMiddleware, require('./routes/reseller'));

// Public Routes (no authentication required)
app.use('/api/public', require('./routes/public'));
app.use('/api/track', require('./routes/track'));
app.use('/api/store', require('./routes/store'));
app.use('/api/referrals', require('./routes/referrals'));

// Customer Routes (supports both guest and authenticated)
app.use('/api/customer', require('./routes/customer/orders'));
app.use('/api/customer', require('./routes/customer/profile'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

module.exports = app;
