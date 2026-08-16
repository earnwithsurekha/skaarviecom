# Security Recommendations for Skaarvi Reseller Platform

## Current Status: ⚠️ HIGH RISK

Your application has several critical security vulnerabilities that need immediate attention.

## Critical Issues to Fix Immediately

### 1. **Remove OTP Bypass (CRITICAL)**
- **Current Issue**: `/api/auth/login-bypass` endpoint bypasses all OTP verification
- **Risk Level**: CRITICAL - Anyone can login with any email address
- **Fix**: Delete this endpoint or protect it with environment checks (dev-only)

### 2. **Implement Rate Limiting**
```javascript
// Install: npm install express-rate-limit
const rateLimit = require('express-rate-limit');

// Login rate limiter - 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to login routes
router.post('/login', loginLimiter, ...);
router.post('/verify-otp', loginLimiter, ...);
```

### 3. **Implement Idle Timeout & Session Management**

#### Backend: Track Last Activity
```javascript
// middleware/sessionTimeout.js
const SESSION_TIMEOUT = 3 * 60 * 1000; // 3 minutes

const sessionTimeoutMiddleware = (req, res, next) => {
  const currentTime = Date.now();
  const lastActivity = req.headers['x-last-activity'];
  
  if (lastActivity) {
    const timeDiff = currentTime - parseInt(lastActivity);
    if (timeDiff > SESSION_TIMEOUT) {
      return res.status(401).json({
        status: 'error',
        code: 'SESSION_TIMEOUT',
        message: 'Your session has expired due to inactivity. Please login again.'
      });
    }
  }
  
  next();
};
```

#### Frontend: Activity Tracker
```javascript
// contexts/SessionContext.js
import { createContext, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes
const WARNING_TIME = 30 * 1000; // 30 seconds before timeout

export const SessionProvider = ({ children }) => {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  let idleTimer = null;
  let warningTimer = null;

  const resetTimers = useCallback(() => {
    clearTimeout(idleTimer);
    clearTimeout(warningTimer);
    setShowWarning(false);
    
    // Show warning 30 seconds before timeout
    warningTimer = setTimeout(() => {
      setShowWarning(true);
    }, IDLE_TIMEOUT - WARNING_TIME);
    
    // Logout after timeout
    idleTimer = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT);
    
    // Update last activity timestamp
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastActivity');
    router.push('/login');
    toast.error('Your session has expired due to inactivity.');
  };

  const continueSession = () => {
    resetTimers();
  };

  useEffect(() => {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetTimers);
    });

    resetTimers();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimers);
      });
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
    };
  }, [resetTimers]);

  return (
    <SessionContext.Provider value={{ continueSession }}>
      {children}
      {showWarning && (
        <IdleWarningModal onContinue={continueSession} onLogout={handleLogout} />
      )}
    </SessionContext.Provider>
  );
};
```

### 4. **Move Tokens to HTTPOnly Cookies**
```javascript
// Backend: Set token in HTTPOnly cookie
res.cookie('token', token, {
  httpOnly: true,  // Prevents JavaScript access
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'strict', // CSRF protection
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});

// Frontend: Remove localStorage usage
// Tokens are now automatically sent with requests via cookies
```

### 5. **Implement OTP Properly**
```javascript
// OTP Security Best Practices:
- OTP should expire after 5 minutes
- Max 3 OTP attempts before blocking
- Rate limit OTP generation (1 per minute)
- Store OTP hashed, not plain text
- Use cryptographically secure random numbers
```

### 6. **Add Security Headers**
```javascript
// Install: npm install helmet
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
```

### 7. **Account Security Features**
```javascript
// Implement:
- Account lockout after 5 failed login attempts
- Email notification on suspicious login
- Login history tracking (IP, device, timestamp)
- Two-factor authentication (optional but recommended)
- Password/PIN requirement (in addition to OTP)
```

### 8. **Input Validation & Sanitization**
```javascript
// Already using express-validator, but ensure:
- Validate all inputs on both frontend and backend
- Sanitize user inputs to prevent SQL injection
- Escape output to prevent XSS
- Validate file uploads (type, size, content)
```

### 9. **HTTPS & Environment Security**
```
✓ Use HTTPS in production (SSL/TLS certificates)
✓ Never commit .env files
✓ Rotate JWT secrets regularly
✓ Use different secrets for dev/staging/production
✓ Enable CORS only for trusted domains
✓ Keep dependencies updated (npm audit fix)
```

## Security Checklist

- [ ] Remove or secure OTP bypass endpoint
- [ ] Implement rate limiting on all auth endpoints
- [ ] Add idle timeout (3 minutes) with warning modal
- [ ] Move tokens from localStorage to HTTPOnly cookies
- [ ] Implement proper OTP verification
- [ ] Add account lockout after failed attempts
- [ ] Add security headers (helmet.js)
- [ ] Implement CSRF protection
- [ ] Add login history tracking
- [ ] Set up activity logging for suspicious behavior
- [ ] Enable HTTPS in production
- [ ] Implement password/PIN in addition to OTP
- [ ] Add email notifications for security events
- [ ] Regular security audits

## Priority Order

1. **IMMEDIATE (Do Today)**
   - Remove OTP bypass
   - Add rate limiting
   - Move tokens to HTTPOnly cookies

2. **HIGH PRIORITY (This Week)**
   - Implement idle timeout
   - Add account lockout
   - Implement proper OTP flow
   - Add security headers

3. **MEDIUM PRIORITY (This Month)**
   - Login history & notifications
   - Two-factor authentication
   - Comprehensive audit logging

## To Answer Your Questions:

### 1. "Idle timeout after 3 minutes?"
**Answer**: NOT IMPLEMENTED. You need to add the session management code above.

### 2. "Is hacking possible?"
**Answer**: YES, ABSOLUTELY. Current vulnerabilities:
- ✅ Anyone can login without OTP (bypass endpoint)
- ✅ Unlimited login attempts (no rate limiting)
- ✅ Token theft via XSS (localStorage)
- ✅ No session timeout (stays logged in forever)
- ✅ No account lockout
- ✅ No activity monitoring

## Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- Node.js Security Checklist: https://blog.risingstack.com/node-js-security-checklist/

## Need Help?

Security is complex. Consider:
1. Security audit by a professional
2. Penetration testing before launch
3. Bug bounty program after launch
4. Regular security training for team
