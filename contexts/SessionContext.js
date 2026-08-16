'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';

const SessionContext = createContext({});

// Configuration
const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes
const WARNING_TIME = 30 * 1000; // 30 seconds before timeout
const CHECK_INTERVAL = 1000; // Check every second

export const SessionProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(IDLE_TIMEOUT);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const checkTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Check if user is on a public page (login, register, etc.)
  const isPublicPage = pathname?.includes('/login') || 
                       pathname?.includes('/register') || 
                       pathname?.includes('/pending-approval');

  // Initialize authentication state
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, [pathname]);

  // Reset all timers and update last activity
  const resetTimers = useCallback(() => {
    if (!isAuthenticated || isPublicPage) return;

    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem('lastActivity', now.toString());
    
    // Clear existing timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    // Hide warning if it's showing
    setShowWarning(false);
    setRemainingTime(IDLE_TIMEOUT);
    
    // Set warning timer (30 seconds before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, IDLE_TIMEOUT - WARNING_TIME);
    
    // Set logout timer
    idleTimerRef.current = setTimeout(() => {
      handleLogout('Your session has expired due to inactivity.');
    }, IDLE_TIMEOUT);
  }, [isAuthenticated, isPublicPage]);

  // Handle logout
  const handleLogout = useCallback((message) => {
    // Clear Redux state
    dispatch(logoutAction());
    
    // Clear all data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('user');
    
    // Clear timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    
    setShowWarning(false);
    setIsAuthenticated(false);
    
    // Show message and redirect to home page
    toast.error(message || 'Session expired. Please login again.');
    router.push('/');
  }, [router, dispatch]);

  // Continue session (reset timers)
  const continueSession = useCallback(() => {
    resetTimers();
    toast.success('Session extended');
  }, [resetTimers]);

  // Update remaining time display
  useEffect(() => {
    if (!isAuthenticated || isPublicPage || !showWarning) return;

    checkTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remaining = IDLE_TIMEOUT - elapsed;
      
      if (remaining > 0) {
        setRemainingTime(remaining);
      } else {
        setRemainingTime(0);
      }
    }, CHECK_INTERVAL);

    return () => {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    };
  }, [isAuthenticated, isPublicPage, showWarning]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated || isPublicPage) return;

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ];

    // Throttle activity tracking (max once per second)
    let throttleTimeout = null;
    const handleActivity = () => {
      if (!throttleTimeout) {
        resetTimers();
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000);
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timers
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (throttleTimeout) clearTimeout(throttleTimeout);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    };
  }, [isAuthenticated, isPublicPage, resetTimers]);

  // Check for activity in other tabs/windows
  useEffect(() => {
    if (!isAuthenticated || isPublicPage) return;

    const checkOtherTabActivity = () => {
      const storedActivity = localStorage.getItem('lastActivity');
      if (storedActivity) {
        const storedTime = parseInt(storedActivity, 10);
        const currentRefTime = lastActivityRef.current;
        
        // If activity in another tab is newer, sync
        if (storedTime > currentRefTime) {
          lastActivityRef.current = storedTime;
          resetTimers();
        }
      }
    };

    const interval = setInterval(checkOtherTabActivity, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isPublicPage, resetTimers]);

  const contextValue = {
    continueSession,
    isIdle: showWarning,
    remainingTime,
    handleLogout,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
      {showWarning && isAuthenticated && !isPublicPage && (
        <IdleWarningModal
          remainingTime={remainingTime}
          onContinue={continueSession}
          onLogout={() => handleLogout('You have been logged out.')}
        />
      )}
    </SessionContext.Provider>
  );
};

// Idle Warning Modal Component
const IdleWarningModal = ({ remainingTime, onContinue, onLogout }) => {
  const seconds = Math.ceil(remainingTime / 1000);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeIn">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
            <svg
              className="h-10 w-10 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Session Timeout Warning
          </h3>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You've been inactive for a while. Your session will expire in:
          </p>

          {/* Countdown */}
          <div className="text-5xl font-bold text-red-600 dark:text-red-400 mb-6">
            {seconds}s
          </div>

          {/* Info Text */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Click "Continue" to stay logged in, or you'll be automatically logged out for your security.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onLogout}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Logout
            </button>
            <button
              onClick={onContinue}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-lg"
            >
              Continue Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to use session context
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

export default SessionContext;
