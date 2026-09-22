'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';

/**
 * TawkToChat Component
 * Integrates Tawk.to live chat widget with AI automation
 * Visible to all visitors (including non-logged-in users)
 * Automatically passes user information when available
 */

const TawkToChat = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const pathname = usePathname();

  useEffect(() => {
    // Load for all visitors (authenticated or not)
    
    // ============================================
    // CONFIGURATION - Tawk.to IDs
    // ============================================
    const PROPERTY_ID = '6a4938a4cd7c231d442e003f';
    const WIDGET_ID = '1jsn0ah9m';
    const compactPortalPrefixes = ['/admin', '/manufacturer', '/customer', '/reseller'];
    const isPortalScreen = compactPortalPrefixes.some((prefix) => pathname?.startsWith(prefix));
    const isPublicPortalScreen = pathname === '/admin' || pathname === '/manufacturer/register';
    const hideOnCompactPortalScreen = isPortalScreen
      && !isPublicPortalScreen
      && window.matchMedia('(max-width: 1023px)').matches;
    const syncInjectedWidgetVisibility = () => {
      document.querySelectorAll('iframe[title="Chat widget"]').forEach((frame) => {
        if (hideOnCompactPortalScreen) {
          frame.dataset.skaarviMobileHidden = 'true';
          frame.style.setProperty('display', 'none', 'important');
        } else if (frame.dataset.skaarviMobileHidden) {
          frame.style.removeProperty('display');
          delete frame.dataset.skaarviMobileHidden;
        }
      });
    };
    const widgetObserver = new MutationObserver(syncInjectedWidgetVisibility);
    widgetObserver.observe(document.body, { childList: true, subtree: true });
    syncInjectedWidgetVisibility();

    globalThis.Tawk_API = globalThis.Tawk_API || {};
    globalThis.Tawk_API.customStyle = { zIndex: 30 };

    // Check if Tawk.to is already loaded
    if (typeof globalThis.Tawk_API.showWidget === 'function') {
      // Update user attributes if user is logged in
      if (isAuthenticated && user) {
        updateTawkAttributes();
      }
      if (hideOnCompactPortalScreen) globalThis.Tawk_API.hideWidget?.();
      else globalThis.Tawk_API.showWidget();
      syncInjectedWidgetVisibility();
      return () => widgetObserver.disconnect();
    }

    // Load Tawk.to script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`;
    script.setAttribute('crossorigin', '*');

    // Initialize Tawk.to API
    globalThis.Tawk_LoadStart = new Date();

    // Set user attributes when widget loads
    globalThis.Tawk_API.onLoad = function() {
      // Only update attributes if user is logged in
      if (isAuthenticated && user) {
        updateTawkAttributes();
      }
      if (hideOnCompactPortalScreen) globalThis.Tawk_API.hideWidget?.();
      syncInjectedWidgetVisibility();
      
      console.log('✅ Tawk.to Chat loaded successfully');
    };

    // Handle chat events
    globalThis.Tawk_API.onChatStarted = function() {
      console.log('💬 Chat conversation started');
    };

    // Append script to document
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);

    // Cleanup function
    return () => {
      widgetObserver.disconnect();
      // Hide widget when component unmounts
      globalThis.Tawk_API?.hideWidget?.();
    };
  }, [isAuthenticated, pathname, user]);

  /**
   * Update Tawk.to user attributes with customer information
   * Only called when user is logged in
   */
  const updateTawkAttributes = () => {
    if (!globalThis.Tawk_API || !user) return;

    try {
      // Set visitor name
      if (
        (user.name || user.businessName)
        && typeof globalThis.Tawk_API.setAttributes === 'function'
      ) {
        globalThis.Tawk_API.setAttributes({
          name: user.name || user.businessName,
          email: user.email || '',
          hash: user.id ? String(user.id) : '',
        }, function(error) {
          if (error) {
            console.error('Error setting Tawk.to attributes:', error);
          }
        });
      }

      // Add custom attributes for better support
      if (typeof globalThis.Tawk_API.addTags === 'function') {
        globalThis.Tawk_API.addTags([
          user.role || 'customer',
          user.status || 'active',
        ], function(error) {
          if (error) {
            console.error('Error adding Tawk.to tags:', error);
          }
        });
      }

      // Set additional visitor data
      const visitorData = {
        'user-id': user.id || 'N/A',
        'role': user.role || 'customer',
        'business-name': user.businessName || 'N/A',
        'phone': user.phone || 'N/A',
        'status': user.status || 'N/A',
      };

      // Add reseller-specific data
      if (user.role === 'reseller' && user.resellerCode) {
        visitorData['reseller-code'] = user.resellerCode;
      }

      // Add manufacturer-specific data
      if (user.role === 'manufacturer' && user.companyName) {
        visitorData['company-name'] = user.companyName;
      }

      // Set custom attributes
      if (typeof globalThis.Tawk_API.addEvent === 'function') {
        globalThis.Tawk_API.addEvent('user-login', visitorData, function(error) {
          if (error) {
            console.error('Error adding Tawk.to event:', error);
          }
        });
      }

    } catch (error) {
      console.error('Error updating Tawk.to attributes:', error);
    }
  };

  // This component doesn't render anything visible
  // The Tawk.to widget appears as a floating button
  return (
      <style jsx global>{`
        /* Customize Tawk.to widget colors */
        #tawk-bubble {
          background-color: #0066cc !important;
        }
        
        /* Hide "Powered by Tawk.to" text (optional CSS override) */
        iframe[title*="chat widget"] {
          /* Widget iframe styling */
        }
        
        /* Additional custom styling for chat widget */
        .tawk-button {
          background: #0066cc !important;
        }
        
        .tawk-min-container {
          background: #0066cc !important;
        }
      `}</style>
  );
};

export default TawkToChat;
