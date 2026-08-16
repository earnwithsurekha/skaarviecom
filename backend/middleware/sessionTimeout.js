// Session Timeout Middleware
// Validates user activity and enforces session timeout

const SESSION_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds

/**
 * Middleware to check session timeout based on last activity
 * Expects 'x-last-activity' header with timestamp from frontend
 */
const sessionTimeoutMiddleware = (req, res, next) => {
  try {
    // Skip timeout check for auth endpoints (login, register, etc.)
    if (req.path.includes('/auth/')) {
      return next();
    }

    const currentTime = Date.now();
    const lastActivity = req.headers['x-last-activity'];
    
    if (lastActivity) {
      const lastActivityTime = parseInt(lastActivity, 10);
      const timeSinceLastActivity = currentTime - lastActivityTime;
      
      // Check if session has timed out
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        return res.status(401).json({
          status: 'error',
          code: 'SESSION_TIMEOUT',
          message: 'Your session has expired due to inactivity. Please login again.',
          timeoutDuration: SESSION_TIMEOUT / 1000, // in seconds
        });
      }
      
      // Add remaining time to response header for frontend tracking
      const remainingTime = SESSION_TIMEOUT - timeSinceLastActivity;
      res.setHeader('x-session-remaining', remainingTime.toString());
    }
    
    next();
  } catch (error) {
    console.error('Session timeout middleware error:', error);
    next(); // Don't block request on error
  }
};

/**
 * Get session timeout configuration
 */
const getSessionConfig = () => ({
  timeoutDuration: SESSION_TIMEOUT,
  warningTime: 30 * 1000, // Show warning 30 seconds before timeout
});

module.exports = {
  sessionTimeoutMiddleware,
  getSessionConfig,
  SESSION_TIMEOUT,
};
