const express = require('express');
const router = express.Router();

// Health check endpoint for ALB
// Mounted at /api/health in server.js, so route is just /
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'skaarvi-backend',
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;
