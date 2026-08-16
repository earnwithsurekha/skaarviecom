'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Heart, Share2, Download, Copy, Check,
  ChevronLeft, ChevronRight, Play, Package, Truck,
  MessageCircle, Send, Facebook, Image as ImageIcon,
  Video, FileText
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (params.id) {
      fetchProductDetails();
    }
  }, [params.id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reseller/products/${params.id}`);
      const result = await response.json();

      if (result.status === 'success') {
        setProduct(result.data.product);
        setImages(result.data.images || []);
        setVideos(result.data.videos || []);
        setIsSaved(result.data.product.is_saved);
      } else {
        console.error('Failed to fetch product:', result.message);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralLink = async () => {
    setGeneratingLink(true);
    try {
      const response = await fetch('/api/reseller/referrals/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: params.id })
      });

      const result = await response.json();
      if (result.status === 'success') {
        setReferralLink(result.data.referralLink);
      }
    } catch (error) {
      console.error('Error generating referral link:', error);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getProductDescription = () => {
    // Truncate description to 200 characters for sharing
    const desc = product.description || '';
    return desc.length > 200 ? desc.substring(0, 200) + '...' : desc;
  };

  const getShareMessage = () => {
    const primaryImage = images.length > 0 ? images[0].image_url : '';
    const description = getProductDescription();
    
    return `🛍️ *${product.name}*\n\n${description}\n\n💰 *Price:* ₹${product.selling_price}\n✨ *Your Profit:* ₹${product.reseller_profit}\n📦 *Stock:* ${product.stock_quantity > 10 ? 'In Stock' : product.stock_quantity > 0 ? `Only ${product.stock_quantity} left!` : 'Out of Stock'}\n\n🔗 *Shop Now:*\n${referralLink}${primaryImage ? '\n\n📸 Product Image:\n' + primaryImage : ''}`;
  };

  const copyCompleteDetails = async () => {
    if (!referralLink) return;
    const message = getShareMessage();
    await copyToClipboard(message);
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
    // Facebook doesn't support pre-filled text, only URL
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const downloadImage = async (imageUrl, index) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.name}-image-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const downloadAllImages = async () => {
    for (let i = 0; i < images.length; i++) {
      await downloadImage(images[i].image_url, i);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleSaveProduct = async () => {
    try {
      const url = `/api/reseller/products/${params.id}/save`;
      const method = isSaved ? 'DELETE' : 'POST';
      
      const response = await fetch(url, { method });
      const result = await response.json();

      if (result.status === 'success') {
        setIsSaved(!isSaved);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
            Product not found
          </h1>
          <button
            onClick={() => router.push('/reseller/products')}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ 
            backgroundColor: 'rgb(var(--color-surface))',
            color: 'rgb(var(--color-text))'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={handleSaveProduct}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ 
            backgroundColor: 'rgb(var(--color-surface))',
            color: isSaved ? 'rgb(220, 38, 38)' : 'rgb(var(--color-text))'
          }}
        >
          <Heart className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left Column - Images & Videos */}
        <div>
          {/* Main Image Display */}
          <div 
            className="relative rounded-lg overflow-hidden mb-4"
            style={{ 
              backgroundColor: 'rgb(var(--color-surface))',
              height: '400px'
            }}
          >
            {images.length > 0 ? (
              <>
                <img
                  src={images[selectedImageIndex]?.image_url}
                  alt={images[selectedImageIndex]?.alt_text || product.name}
                  className="w-full h-full object-contain"
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white' }}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white' }}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{
                        backgroundColor: index === selectedImageIndex 
                          ? 'rgb(var(--color-primary))' 
                          : 'rgba(255, 255, 255, 0.5)'
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="w-20 h-20" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mb-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className="relative rounded-lg overflow-hidden aspect-square border-2 transition-all"
                  style={{
                    borderColor: index === selectedImageIndex 
                      ? 'rgb(var(--color-primary))' 
                      : 'rgb(var(--color-border))',
                    backgroundColor: 'rgb(var(--color-surface))'
                  }}
                >
                  <img
                    src={image.image_url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Videos Section */}
          {videos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(var(--color-text))' }}>
                Product Videos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {videos.map((video, index) => (
                  <a
                    key={index}
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative rounded-lg overflow-hidden aspect-video group"
                    style={{ backgroundColor: 'rgb(var(--color-surface))' }}
                  >
                    <img
                      src={video.thumbnail_url || '/video-placeholder.jpg'}
                      alt={`Video ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div>
          {/* Product Title & Category */}
          <div className="mb-4">
            <span 
              className="text-sm px-3 py-1 rounded-full inline-block mb-2"
              style={{ 
                backgroundColor: 'rgb(var(--color-primary) / 0.1)',
                color: 'rgb(var(--color-primary))'
              }}
            >
              {product.category_name || 'Uncategorized'}
            </span>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              {product.name}
            </h1>
            {product.manufacturer_name && (
              <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                by {product.manufacturer_name}
              </p>
            )}
          </div>

          {/* Pricing Section */}
          <div 
            className="p-6 rounded-lg mb-6"
            style={{ backgroundColor: 'rgb(var(--color-surface))' }}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  Selling Price
                </p>
                <p className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                  ₹{product.selling_price}
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  Your Profit
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{product.reseller_profit}
                </p>
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5" style={{ color: 'rgb(var(--color-text) / 0.7)' }} />
              <span className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                Stock:
              </span>
              <span 
                className={`text-sm font-medium ${
                  product.stock_quantity > 10 ? 'text-green-600' : 
                  product.stock_quantity > 0 ? 'text-orange-500' : 'text-red-500'
                }`}
              >
                {product.stock_quantity > 10 ? 'In Stock' : 
                 product.stock_quantity > 0 ? `Low Stock (${product.stock_quantity})` : 'Out of Stock'}
              </span>
            </div>

            {/* Delivery Info */}
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" style={{ color: 'rgb(var(--color-text) / 0.7)' }} />
              <span className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                Delivery: {product.delivery_time || '3-5 business days'}
              </span>
            </div>
          </div>

          {/* Referral Link Section */}
          <div 
            className="p-6 rounded-lg mb-6"
            style={{ backgroundColor: 'rgb(var(--color-surface))' }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(var(--color-text))' }}>
              Share & Earn
            </h3>

            {!referralLink ? (
              <button
                onClick={generateReferralLink}
                disabled={generatingLink}
                className="w-full py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{ 
                  backgroundColor: 'rgb(var(--color-primary))',
                  color: 'white'
                }}
              >
                {generatingLink ? 'Generating...' : 'Generate Referral Link'}
              </button>
            ) : (
              <>
                {/* Referral Link Display */}
                <div 
                  className="flex items-center gap-2 p-3 rounded-lg mb-4"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-background))',
                    border: '1px solid rgb(var(--color-border))'
                  }}
                >
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: 'rgb(var(--color-text))' }}
                  />
                  <button
                    onClick={() => copyToClipboard(referralLink)}
                    className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
                    title="Copy link only"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Sharing Info Card */}
                <div 
                  className="p-3 rounded-lg mb-4"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-primary) / 0.05)',
                    border: '1px solid rgb(var(--color-primary) / 0.2)'
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Share2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--color-primary))' }} />
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-primary))' }}>
                        ✨ One-Click Sharing
                      </p>
                      <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                        Share buttons automatically include product image, description, price, and your referral link
                      </p>
                    </div>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    onClick={shareOnWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg transition-colors hover:opacity-90"
                    style={{ 
                      backgroundColor: 'rgb(37, 211, 102)',
                      color: 'white'
                    }}
                    title="Share complete details on WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </button>

                  <button
                    onClick={shareOnTelegram}
                    className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg transition-colors hover:opacity-90"
                    style={{ 
                      backgroundColor: 'rgb(34, 155, 215)',
                      color: 'white'
                    }}
                    title="Share complete details on Telegram"
                  >
                    <Send className="w-5 h-5" />
                    <span className="text-sm font-medium">Telegram</span>
                  </button>

                  <button
                    onClick={shareOnFacebook}
                    className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg transition-colors hover:opacity-90"
                    style={{ 
                      backgroundColor: 'rgb(24, 119, 242)',
                      color: 'white'
                    }}
                    title="Share link on Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                    <span className="text-sm font-medium">Facebook</span>
                  </button>
                </div>

                {/* Copy Complete Details Button */}
                <div className="mb-4">
                  <button
                    onClick={copyCompleteDetails}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-surface))',
                      border: '2px solid rgb(var(--color-primary))',
                      color: 'rgb(var(--color-primary))'
                    }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Complete Details Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span className="font-medium">Copy Complete Details</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center mt-2" style={{ color: 'rgb(var(--color-text) / 0.6)' }}>
                    Includes image, description & link
                  </p>
                </div>

                {/* Download Options */}
                <div className="border-t pt-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <p className="text-sm font-medium mb-3" style={{ color: 'rgb(var(--color-text))' }}>
                    Download Assets
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={downloadAllImages}
                      disabled={images.length === 0}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-primary) / 0.1)',
                        color: 'rgb(var(--color-primary))'
                      }}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-sm">Images</span>
                    </button>

                    <button
                      disabled={videos.length === 0}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-primary) / 0.1)',
                        color: 'rgb(var(--color-primary))'
                      }}
                    >
                      <Video className="w-4 h-4" />
                      <span className="text-sm">Videos</span>
                    </button>

                    <button
                      className="col-span-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-primary) / 0.1)',
                        color: 'rgb(var(--color-primary))'
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">Download Catalog PDF</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section - Description & Specifications */}
      <div 
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: 'rgb(var(--color-surface))' }}
      >
        {/* Tab Headers */}
        <div 
          className="flex border-b"
          style={{ borderColor: 'rgb(var(--color-border))' }}
        >
          <button
            onClick={() => setActiveTab('description')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'description' ? 'border-b-2' : ''
            }`}
            style={{
              color: activeTab === 'description' 
                ? 'rgb(var(--color-primary))' 
                : 'rgb(var(--color-text) / 0.7)',
              borderColor: activeTab === 'description' 
                ? 'rgb(var(--color-primary))' 
                : 'transparent'
            }}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'specifications' ? 'border-b-2' : ''
            }`}
            style={{
              color: activeTab === 'specifications' 
                ? 'rgb(var(--color-primary))' 
                : 'rgb(var(--color-text) / 0.7)',
              borderColor: activeTab === 'specifications' 
                ? 'rgb(var(--color-primary))' 
                : 'transparent'
            }}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'shipping' ? 'border-b-2' : ''
            }`}
            style={{
              color: activeTab === 'shipping' 
                ? 'rgb(var(--color-primary))' 
                : 'rgb(var(--color-text) / 0.7)',
              borderColor: activeTab === 'shipping' 
                ? 'rgb(var(--color-primary))' 
                : 'transparent'
            }}
          >
            Shipping Info
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'description' && (
            <div style={{ color: 'rgb(var(--color-text))' }}>
              <p className="whitespace-pre-wrap">
                {product.description || 'No description available.'}
              </p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div>
              {product.specifications ? (
                <div className="space-y-3">
                  {Object.entries(
                    typeof product.specifications === 'string' 
                      ? JSON.parse(product.specifications) 
                      : product.specifications
                  ).map(([key, value]) => (
                    <div key={key} className="flex py-2 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                      <span className="w-1/3 font-medium" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                        {key}
                      </span>
                      <span style={{ color: 'rgb(var(--color-text))' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  No specifications available.
                </p>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4" style={{ color: 'rgb(var(--color-text))' }}>
              <div>
                <h4 className="font-semibold mb-2">Delivery Time</h4>
                <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  {product.delivery_time || '3-5 business days'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Shipping Information</h4>
                <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  {product.shipping_info || 'Free shipping on orders above ₹500. Standard shipping charges apply for orders below ₹500.'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Return Policy</h4>
                <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  {product.return_policy || '7 days return policy. Product must be unused and in original packaging.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
