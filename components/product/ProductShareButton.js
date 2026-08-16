'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Share2, 
  MessageCircle, 
  Mail, 
  Link as LinkIcon,
  QrCode,
  X,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProductShareButton({ 
  productId, 
  productName,
  productImage,
  productUrl,
  source = 'product_page'
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }

    // Close menu on scroll
    const handleScroll = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [showMenu]);

  // Ensure we have a full URL for sharing
  const getFullUrl = () => {
    if (typeof window === 'undefined') return productUrl;
    if (productUrl.startsWith('http')) return productUrl;
    return `${window.location.origin}${productUrl}`;
  };

  const trackShare = async (platform) => {
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('session_id') || generateSessionId();
      
      await fetch(`/api/analytics/products/${productId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          platform,
          source,
          sessionId,
          deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        }),
      });
    } catch (error) {
      console.error('Track share error:', error);
    }
  };

  const generateSessionId = () => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
    return sessionId;
  };

  const handleWhatsAppShare = (e) => {
    e.stopPropagation();
    const fullUrl = getFullUrl();
    const text = `Check out ${productName}!\n${fullUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    trackShare('whatsapp');
    setShowMenu(false);
    toast.success('Opening WhatsApp...');
  };

  const handleEmailShare = (e) => {
    e.stopPropagation();
    const fullUrl = getFullUrl();
    const subject = `Check out ${productName}`;
    const body = `I found this product and thought you might be interested:\n\n${productName}\n\n${fullUrl}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    trackShare('email');
    setShowMenu(false);
    toast.success('Opening email client...');
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    try {
      const fullUrl = getFullUrl();
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      trackShare('copy_link');
      toast.success('Link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleQRCode = (e) => {
    e.stopPropagation();
    // Generate QR code - you can integrate a QR code library here
    trackShare('qr_code');
    toast.success('QR code feature coming soon!');
    setShowMenu(false);
  };

  return (
    <div className="relative z-50" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
        title="Share product"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          
          {/* Share Menu - Fixed positioning */}
          <div 
            className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 z-[9999] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
          >
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Share</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>

            <div className="p-1.5">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-left"
              >
                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <MessageCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  WhatsApp
                </span>
              </button>

              {/* Email */}
              <button
                onClick={handleEmailShare}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-left"
              >
                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  Email
                </span>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-left"
              >
                <div className="p-1 bg-gray-100 dark:bg-gray-600 rounded-full">
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <LinkIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {copied ? 'Copied!' : 'Copy Link'}
                </span>
              </button>

              {/* QR Code */}
              <button
                onClick={handleQRCode}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-left"
              >
                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <QrCode className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  QR Code
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
