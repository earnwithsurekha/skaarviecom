# Security Recommendations for Skaarvi Reseller Platform

## Verified Local Review: 2026-10-21

Status: critical authentication defects reproduced. No production exploitation,
load testing, real-user password changes, live database access or AWS configuration
changes were performed. Application runtime code was not changed by this review.

### Executed Checks

The isolated characterization suite uses the real Express authentication router,
fake accounts, a test-only signing key and mocked database/email/upload services:

```powershell
node backend/node_modules/jest/bin/jest.js --rootDir backend --runInBand --coverage=false --runTestsByPath backend/routes/auth.security.test.js
```

Result: 8/8 tests reproduced insecure behavior. A passing characterization test
means the vulnerability still exists, not that the application is protected.
After remediation, convert these tests into assertions that reject the attack.

| Priority | Reproduced behavior | Code to change | Required security behavior |
| --- | --- | --- | --- |
| Critical | Email alone produces valid admin, customer and manufacturer tokens | [Backend auth routes](backend/routes/auth.js), `/login-bypass`; [Next.js proxy](app/api/auth/login-bypass/route.js); [Admin login](app/login/admin/page.js) | Remove production bypass; require verified credentials and administrator MFA. Protect the API, not only the page. |
| Critical | Existing password is overwritten even when manufacturer registration returns HTTP 400 | [Backend auth routes](backend/routes/auth.js), `/register` | Reject duplicate identities before any mutation; require verified ownership for account linking and password changes. |
| High | Refresh tokens pass access-token verification | [JWT helpers](backend/utils/jwt.js); [Auth middleware](backend/middleware/auth.js) | Explicit token purpose, validated issuer/audience/algorithm, and access-only verification for APIs and sockets. |
| High | An access token can be exchanged for new access/refresh tokens | [Backend auth routes](backend/routes/auth.js), `/refresh` | Verify refresh purpose, current account status and server-side session state; rotate/revoke refresh tokens. |
| High | Wrong OTP guesses never reach a record whose attempt counter can be updated | [Backend auth routes](backend/routes/auth.js), `/verify-otp` | Fetch the active challenge by identity/purpose; increment failed attempts atomically, enforce limits and consume once. |
| Medium | Omitting the client activity header bypasses inactivity enforcement | [Session timeout middleware](backend/middleware/sessionTimeout.js) | Enforce idle expiration using server-maintained session activity, not a caller-controlled timestamp. |

The three email-only role cases account for three tests; the other five behaviors
account for one test each. No real administrator email or production token was used.

### Additional Source-Confirmed Risks

These findings were inspected in source, not exercised against production:

| Risk | Code to change | Required change |
| --- | --- | --- |
| Client-controlled order header total | [Customer orders](backend/routes/customer/orders.js), `POST /orders` | Derive order totals from database prices, validated quantities and server-side fees/discounts; never trust client totals. |
| Public registration buffers multipart files without explicit size limits | [Backend auth routes](backend/routes/auth.js), local Multer setup | Apply file/count/field limits before buffering; validate file signatures/types and rate-limit uploads. JSON limits do not cover multipart bodies. |
| OTP generation uses non-cryptographic randomness and verification logs submitted codes | [Backend auth routes](backend/routes/auth.js) | Use `crypto.randomInt`, protected OTP storage, per-account/IP throttles and secret-safe logs. |
| Logout does not invalidate tokens | [Backend auth routes](backend/routes/auth.js), `/logout` | Revoke the server-side session/refresh token; use short-lived access tokens and a revocation strategy. |
| Identity documents can be exposed by the supplied bucket policy or local static handler | [Bucket policy](backend/s3-bucket-policy.json); [Upload storage](backend/middleware/upload.js); [Static uploads](backend/server.js) | Keep KYC objects private and authorize access. Separate public product media from private documents. Verify actual deployed policies. |
| Browser-readable long-lived credentials | [Admin login](app/login/admin/page.js); other login pages and [API client](lib/api.js) | Prefer HttpOnly cookies with appropriate CSRF defenses; remove persistent browser token copies in a coordinated auth migration. |
| Rate limiter misses OTP and registration; proxy trust is not explicitly configured | [Backend server](backend/server.js) | Limit sensitive routes and WebSocket abuse; validate actual Caddy/Next.js forwarding behavior before narrowly configuring trusted proxies. |

### Dependency Audit Results

Executed `npm audit --omit=dev --json` separately in the repository root and backend.
No packages were installed, upgraded or automatically fixed.

| Locked production tree | Critical | High | Moderate | Total affected dependencies |
| --- | --- | --- | --- | --- |
| Frontend | 1 | 10 | 6 | 17 |
| Backend | 1 | 5 | 16 | 22 |

These are npm advisory/dependency counts, not a count of verified reachable attacks.
The two trees overlap and must not be added as unique vulnerabilities.

- Frontend: Next.js is reported critical. Upgrade to a currently supported patched
  release and validate App Router, authentication, image handling and production builds.
- Backend: transitive `proxy-addr` is reported critical for a trusted-subnet IP
  spoofing issue. Applicability depends on proxy configuration; upgrade through a
  compatible Express dependency tree and test client-IP/rate-limit behavior.
- Direct-package findings also include Axios, Nodemailer and backend Sharp.
- AWS SDK v2 requires migration planning, not a blind downgrade to a version
  suggested by the audit resolver. Some Firebase/Sequelize suggestions are also
  major-version changes or downgrades; review them manually.
- Remediation locations: both `package.json` files and their corresponding lockfiles.
  Do not run `npm audit fix --force` on production without compatibility testing.

### Deployment Controls Still Requiring Live Verification

- RDS: remove inbound TCP 3306 from `0.0.0.0/0` after validating the working
  restricted source. The user reported a private-IP rule works; ensure it uses
  the exact address with `/32`, not a broad subnet. Prefer a verified SG source
  long-term. Confirm database TLS and public-accessibility settings separately.
- EC2: expose web ports 80/443 only; restrict SSH or use Session Manager. Keep
  3000, 5000, Caddy admin port 2019 and database ports inaccessible publicly.
- Caddy: HTTPS/routing do not fix authentication or act as a WAF. Consider bounded
  request bodies, safe security headers, rotated access logs and a tested CSP.
- Host-network containers share the host network boundary. Keep task/instance
  roles scoped and prevent application access to instance-profile credentials.
- Review live S3 policies, IAM, MFA, CloudTrail, backups, root-disk encryption and
  unusual authentication/withdrawal activity. The root disk was unencrypted in
  an earlier screenshot. No current live verification was performed here.

### Remediation Order and Verification

1. Contain the public login bypass and unsafe manufacturer registration routes.
   This will interrupt email-only administrator login until real authentication
   is implemented. Caddy restrictions must target API routes as well as UI pages.
2. Fix those two root causes and add negative regression tests before deployment.
3. Invalidate existing sessions and rotate JWT signing secrets after containment;
   rotate other credentials if exposure is established. Never record secrets here.
4. Fix token purpose/revocation, OTP controls, upload limits and checkout totals.
5. Upgrade dependencies in tested groups and re-run production dependency audits.
6. Verify network/storage restrictions, then run staged end-to-end role, payment,
   upload and chat checks. Do not mistake a healthy homepage for security coverage.

This is a focused assessment, not a complete penetration test or breach clearance.
SQL injection coverage across all routes, stored/reflected XSS, SSRF reachability,
payment-provider callbacks, concurrency abuse and all role/object-ownership paths
remain to be tested in an isolated staging environment.

## Legacy Recommendations Below

The older examples below are historical guidance, not verified remediation.
In particular, client-supplied activity headers and client-side idle timers are
not security boundaries. Prefer the verified findings and requirements above.

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
