'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';

/**
 * TawkToChat Component
 * Integrates Tawk.to live chat widget with AI automation
 * Visible to all visitors (including non-logged-in users)
 * Automatically passes user information when available
 */

const TawkToChat = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Load for all visitors (authenticated or not)
    
    // ============================================
    // CONFIGURATION - Tawk.to IDs
    // ============================================
    const PROPERTY_ID = '6a4938a4cd7c231d442e003f';
    const WIDGET_ID = '1jsn0ah9m';

    // Check if Tawk.to is already loaded
    if (globalThis.Tawk_API) {
      // Update user attributes if user is logged in
      if (isAuthenticated && user) {
        updateTawkAttributes();
      }
      // Use optional chaining in case showWidget isn't loaded yet
      globalThis.Tawk_API.showWidget?.();
      return;
    }

    // Load Tawk.to script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`;
    script.setAttribute('crossorigin', '*');

    // Initialize Tawk.to API
    globalThis.Tawk_API = globalThis.Tawk_API || {};
    globalThis.Tawk_LoadStart = new Date();

    // Set user attributes when widget loads
    globalThis.Tawk_API.onLoad = function() {
      // Only update attributes if user is logged in
      if (isAuthenticated && user) {
        updateTawkAttributes();
      }
      
      // Customize widget appearance - Set to blue
      globalThis.Tawk_API.setAttributes({
        backgroundColor: '#0066cc', // Blue color
        bubbleColor: '#0066cc',
      }, function(error) {
        if (error) {
          console.error('Error setting Tawk.to colors:', error);
        }
      });
      
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
      // Hide widget when component unmounts
      globalThis.Tawk_API?.hideWidget?.();
    };
  }, [isAuthenticated, user]);

  /**
   * Update Tawk.to user attributes with customer information
   * Only called when user is logged in
   */
  const updateTawkAttributes = () => {
    if (!globalThis.Tawk_API || !user) return;

    try {
      // Set visitor name
      if (user.name || user.businessName) {
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
      globalThis.Tawk_API.addTags([
        user.role || 'customer',
        user.status || 'active',
      ], function(error) {
        if (error) {
          console.error('Error adding Tawk.to tags:', error);
        }
      });

      // Set additional visitor data
      const visitorData = {
        'User ID': user.id || 'N/A',
        'Role': user.role || 'customer',
        'Business Name': user.businessName || 'N/A',
        'Phone': user.phone || 'N/A',
        'Status': user.status || 'N/A',
      };

      // Add reseller-specific data
      if (user.role === 'reseller' && user.resellerCode) {
        visitorData['Reseller Code'] = user.resellerCode;
      }

      // Add manufacturer-specific data
      if (user.role === 'manufacturer' && user.companyName) {
        visitorData['Company Name'] = user.companyName;
      }

      // Set custom attributes
      globalThis.Tawk_API.addEvent('user-login', visitorData, function(error) {
        if (error) {
          console.error('Error adding Tawk.to event:', error);
        }
      });

    } catch (error) {
      console.error('Error updating Tawk.to attributes:', error);
    }
  };

  // This component doesn't render anything visible
  // The Tawk.to widget appears as a floating button
  return (
    <>
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
    </>
  );
};

export default TawkToChat;
