const express = require('express');
const router = express.Router();

// Health check endpoint for ALB
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'skaarvi-backend',
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;
