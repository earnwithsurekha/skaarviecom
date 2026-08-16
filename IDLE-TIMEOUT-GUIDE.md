# Idle Timeout Implementation Guide

## ✅ Implementation Complete

The idle timeout feature has been successfully implemented with the following components:

## 📁 Files Created/Modified

### Backend
1. **`backend/middleware/sessionTimeout.js`** (NEW)
   - Validates user activity timestamps
   - Enforces 3-minute session timeout
   - Returns `SESSION_TIMEOUT` error when expired

### Frontend
2. **`contexts/SessionContext.js`** (NEW)
   - Tracks user activity (mouse, keyboard, scroll, touch)
   - Starts 3-minute idle timer
   - Shows warning modal 30 seconds before logout
   - Auto-logout after 3 minutes of inactivity
   - Syncs activity across browser tabs

3. **`lib/apiWithTimeout.js`** (NEW)
   - Enhanced API utility functions
   - Automatically includes `x-last-activity` header
   - Handles session timeout responses

4. **`app/providers.js`** (MODIFIED)
   - Wrapped app with `SessionProvider`

5. **`backend/server.js`** (MODIFIED)
   - Added session timeout middleware

## 🎯 Features Implemented

### ✅ Activity Tracking
- Monitors: mouse clicks, keyboard input, scrolling, touch events
- Throttled to once per second for performance
- Works across multiple tabs/windows

### ✅ Warning Modal
- Appears 30 seconds before logout
- Shows countdown timer
- Options to "Continue Session" or "Logout"
- Prevents accidental timeouts

### ✅ Automatic Logout
- After 3 minutes of inactivity
- Clears all tokens and user data
- Redirects to login page
- Shows appropriate toast message

### ✅ Session Synchronization
- Activity in one tab extends session in all tabs
- Uses localStorage for cross-tab communication
- Prevents logout when user is active elsewhere

## 🔧 Configuration

### Adjust Timeout Duration
```javascript
// In contexts/SessionContext.js
const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes
const WARNING_TIME = 30 * 1000;     // 30 seconds warning

// In backend/middleware/sessionTimeout.js
const SESSION_TIMEOUT = 3 * 60 * 1000; // Must match frontend
```

## 🚀 How It Works

### Flow:
1. **User logs in** → Timer starts
2. **User is active** → Timer resets on every action
3. **User is idle for 2:30** → Warning modal appears
4. **User clicks "Continue"** → Timer resets, modal closes
5. **No action for 30 more seconds** → Auto-logout

### Backend Validation:
- Every API request includes `x-last-activity` header
- Backend checks if time since last activity > 3 minutes
- Returns 401 with `SESSION_TIMEOUT` code if expired
- Frontend automatically redirects to login

## 📊 Activity Events Tracked
```javascript
- mousedown    // Mouse button pressed
- mousemove    // Mouse moved
- keydown      // Keyboard key pressed
- scroll       // Page scrolled
- touchstart   // Touch screen touched
- click        // Element clicked
- focus        // Window/tab focused
```

## 🎨 Warning Modal Features

### Visual Design:
- Yellow warning icon
- Large countdown timer
- Clear action buttons
- Dark mode support
- Backdrop blur effect
- Center screen positioning

### User Actions:
- **Continue Session**: Resets timer, extends session
- **Logout**: Immediately logs out user

## 🔐 Security Benefits

1. **Prevents Unauthorized Access**
   - Auto-logout protects unattended sessions
   - No manual logout needed

2. **Reduces Risk of Session Hijacking**
   - Tokens expire quickly when inactive
   - Limited window for token theft

3. **Compliance**
   - Meets security standards (PCI-DSS, HIPAA)
   - Good practice for financial applications

4. **User Privacy**
   - Protects data in shared/public environments
   - Prevents others from accessing account

## 🧪 Testing

### Test Scenarios:
1. ✅ Login and stay idle for 3 minutes → Should auto-logout
2. ✅ Warning appears at 2:30 → Click Continue → Timer resets
3. ✅ Open two tabs → Activity in one extends both sessions
4. ✅ Close tab during warning → No errors on other tabs
5. ✅ Make API call after timeout → Returns 401 SESSION_TIMEOUT

### Manual Testing:
```bash
# For faster testing, temporarily reduce timeout:
# Change to 1 minute (60000ms) instead of 3 minutes
const IDLE_TIMEOUT = 60 * 1000; // 1 minute for testing
const WARNING_TIME = 10 * 1000; // 10 seconds warning
```

## 📱 Public Pages (No Timeout)

The following pages are excluded from idle timeout:
- `/login`
- `/register`
- `/pending-approval`
- Any `/auth/*` routes

## 🔄 Session Extension

Sessions are extended on:
- Any mouse/keyboard/touch activity
- Every API request
- Clicking "Continue Session" button
- Focus events (switching back to tab)

## ⚠️ Important Notes

1. **Server Time vs Client Time**
   - Uses client timestamps for activity
   - Backend validates against server time
   - Handles timezone differences

2. **Multiple Devices**
   - Each device has independent session
   - Logging out one doesn't affect others
   - Each needs separate authentication

3. **Development vs Production**
   - Works immediately in development
   - No additional configuration needed
   - Same behavior in production

## 🎯 Next Steps (Optional Enhancements)

1. **Configurable Timeout**
   - Admin panel setting for timeout duration
   - Different timeouts for different roles

2. **Activity Logging**
   - Track session duration
   - Log timeout events
   - Analytics on user activity patterns

3. **Remember Device**
   - Longer timeout for trusted devices
   - Device fingerprinting

4. **Visual Indicator**
   - Navbar indicator showing remaining time
   - Progress bar during warning

## 🛠️ Troubleshooting

### Issue: Warning modal not appearing
- Check if SessionProvider is wrapping your app
- Verify user is authenticated
- Check browser console for errors

### Issue: Timer not resetting
- Ensure event listeners are attached
- Check if throttling is working
- Verify lastActivity is updating

### Issue: Logged out immediately
- Check IDLE_TIMEOUT values match backend/frontend
- Verify clock sync between client and server
- Check for JavaScript errors

## 📖 Usage Example

```javascript
// In any component:
import { useSession } from '@/contexts/SessionContext';

function MyComponent() {
  const { isIdle, remainingTime, continueSession } = useSession();
  
  return (
    <div>
      {isIdle && <p>Warning: Session expiring soon!</p>}
      <p>Time remaining: {Math.ceil(remainingTime / 1000)}s</p>
      <button onClick={continueSession}>Extend Session</button>
    </div>
  );
}
```

## ✅ Implementation Checklist

- [x] Backend session timeout middleware
- [x] Frontend SessionProvider context
- [x] Activity event tracking
- [x] Warning modal component
- [x] Cross-tab synchronization
- [x] API request headers
- [x] Automatic logout
- [x] Public page exclusions
- [x] Toast notifications
- [x] Dark mode support

## 🎉 Status: READY FOR USE

The idle timeout feature is fully implemented and ready to use. Just restart your backend and frontend servers to activate it!
