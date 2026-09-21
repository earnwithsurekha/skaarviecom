'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  Package,
  Trash2,
  Share2,
  Eye,
  MessageCircle,
  Send,
  Facebook,
  Copy,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function SavedProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSavedProducts();
  }, []);

  const fetchSavedProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/reseller/products/saved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch saved products');

      const data = await response.json();
      
      if (data.status === 'success') {
        setProducts(data.data.products);
      }

    } catch (error) {
      console.error('Saved products fetch error:', error);
      toast.error('Failed to load saved products');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/reseller/products/${productId}/save`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to remove product');

      toast.success('Product removed from saved items');
      
      // Remove from local state
      setProducts(products.filter(p => p.id !== productId));

    } catch (error) {
      console.error('Remove product error:', error);
      toast.error('Failed to remove product');
    }
  };

  const generateReferralLink = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/reseller/referrals/generate-link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) throw new Error('Failed to generate link');

      const data = await response.json();
      
      if (data.status === 'success') {
        return data.data.referralLink;
      }
      return null;

    } catch (error) {
      console.error('Generate link error:', error);
      toast.error('Failed to generate referral link');
      return null;
    }
  };

  const openShareModal = async (product) => {
    setSelectedProduct(product);
    setShareModalOpen(true);
    
    // Generate referral link
    const link = await generateReferralLink(product.id);
    if (link) {
      setReferralLink(link);
    }
  };

  const getProductDescription = (product) => {
    const desc = product.description || '';
    return desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
  };

  const getShareMessage = () => {
    if (!selectedProduct || !referralLink) return '';
    
    const description = getProductDescription(selectedProduct);
    return `🛍️ *${selectedProduct.name}*\n\n${description}\n\n💰 *Price:* ₹${selectedProduct.selling_price}\n✨ *Your Profit:* ₹${selectedProduct.reseller_profit}\n\n🔗 *Shop Now:*\n${referralLink}${selectedProduct.primary_image ? '\n\n📸 Product Image:\n' + selectedProduct.primary_image : ''}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy');
    }
  };

  const shareOnWhatsApp = () => {
    if (!referralLink) return;
    const message = getShareMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOnTelegram = () => {
    if (!referralLink) return;
    const message = getShareMessage();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOnFacebook = () => {
    if (!referralLink) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Saved Products
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Products you've saved for quick access
        </p>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow group"
            >
              <div className="relative aspect-square">
                {product.primary_image ? (
                  <Image
                    src={product.primary_image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {product.name}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Selling Price:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹{parseFloat(product.selling_price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Your Profit:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ₹{parseFloat(product.reseller_profit).toFixed(2)}
                    </span>
                  </div>
                  {product.saved_at && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Saved on {new Date(product.saved_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/reseller/products/${product.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                  <button
                    onClick={() => openShareModal(product)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Bookmark className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Saved Products
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Save products you want to promote for quick access
          </p>
          <Link
            href="/reseller/products"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'rgb(var(--color-primary))' }}
          >
            <Package className="h-5 w-5" />
            Browse Products
          </Link>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShareModalOpen(false)}
        >
          <div 
            className="rounded-lg p-6 max-w-md w-full"
            style={{ backgroundColor: 'rgb(var(--color-surface))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                Share Product
              </h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-1 rounded-lg hover:opacity-70"
                style={{ color: 'rgb(var(--color-text) / 0.7)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Info */}
            <div className="flex gap-3 mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
              {selectedProduct.primary_image ? (
                <img
                  src={selectedProduct.primary_image}
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                  <Package className="w-8 h-8" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-medium line-clamp-2 text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                  {selectedProduct.name}
                </h4>
                <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  ₹{selectedProduct.selling_price} • Profit: ₹{selectedProduct.reseller_profit}
                </p>
              </div>
            </div>

            {/* One-Click Share Info */}
            <div 
              className="p-3 rounded-lg mb-4"
              style={{ 
                backgroundColor: 'rgb(var(--color-primary) / 0.05)',
                border: '1px solid rgb(var(--color-primary) / 0.2)'
              }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-primary))' }}>
                ✨ One-Click Sharing
              </p>
              <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                Automatically includes product image, description, price, and your referral link
              </p>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={shareOnWhatsApp}
                disabled={!referralLink}
                className="flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'rgb(37, 211, 102)', color: 'white' }}
              >
                <MessageCircle className="w-6 h-6" />
                <span className="text-xs font-medium">WhatsApp</span>
              </button>

              <button
                onClick={shareOnTelegram}
                disabled={!referralLink}
                className="flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'rgb(34, 155, 215)', color: 'white' }}
              >
                <Send className="w-6 h-6" />
                <span className="text-xs font-medium">Telegram</span>
              </button>

              <button
                onClick={shareOnFacebook}
                disabled={!referralLink}
                className="flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'rgb(24, 119, 242)', color: 'white' }}
              >
                <Facebook className="w-6 h-6" />
                <span className="text-xs font-medium">Facebook</span>
              </button>
            </div>

            {/* Copy Complete Details */}
            <button
              onClick={() => copyToClipboard(getShareMessage())}
              disabled={!referralLink}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-all disabled:opacity-50"
              style={{ 
                backgroundColor: 'rgb(var(--color-primary))',
                color: 'white'
              }}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="font-medium">Copy Complete Details</span>
                </>
              )}
            </button>

            {/* Referral Link */}
            {referralLink && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <p className="text-xs font-medium mb-2" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  Your Referral Link:
                </p>
                <div 
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-background))',
                    border: '1px solid rgb(var(--color-border))'
                  }}
                >
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-transparent outline-none text-xs"
                    style={{ color: 'rgb(var(--color-text))' }}
                  />
                  <button
                    onClick={() => copyToClipboard(referralLink)}
                    className="p-1 rounded hover:opacity-70"
                    style={{ color: 'rgb(var(--color-primary))' }}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
