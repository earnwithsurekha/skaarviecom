const express = require('express');
const router = express.Router();

// Middleware to ensure user is a reseller
const resellerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Authentication required' 
    });
  }

  // Allow access if user's role is 'reseller' OR if they have a resellerId
  // (resellers logged in through customer portal will have resellerId but role='customer')
  if (req.user.role !== 'reseller' && !req.user.resellerId) {
    return res.status(403).json({ 
      status: 'error',
      message: 'Reseller access only. Your role: ' + req.user.role 
    });
  }

  next();
};

// Apply reseller-only middleware to all routes
router.use(resellerOnly);

// Import route modules
const dashboardRoutes = require('./dashboard');
const productsRoutes = require('./products');
const walletRoutes = require('./wallet');
const earningsRoutes = require('./earnings');
const ordersRoutes = require('./orders');
const referralsRoutes = require('./referrals');
const profileRoutes = require('./profile');
const withdrawalsRoutes = require('./withdrawals');
const mediaRoutes = require('./media');
const myStoreRoutes = require('./myStore');
const analyticsRoutes = require('./analytics');
const leaderboardRoutes = require('./leaderboard');
const supportRoutes = require('./support');

// Mount routes
router.use('/dashboard', dashboardRoutes);
router.use('/products', productsRoutes);
router.use('/wallet', walletRoutes);
router.use('/earnings', earningsRoutes);
router.use('/orders', ordersRoutes);
router.use('/referrals', referralsRoutes);
router.use('/profile', profileRoutes);
router.use('/withdrawals', withdrawalsRoutes);
router.use('/media', mediaRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/support', supportRoutes);
router.use('/', myStoreRoutes);

module.exports = router;
