'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Package, 
  Edit,
  Trash2,
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  TrendingUp,
  ShoppingCart,
  Heart,
  Share2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function ManufacturerProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/products/${productId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Backend returns { data: { product: {...} } }
          setProduct(result.data.product || result.data);
        } else {
          toast.error('Product not found');
          router.push('/manufacturer/products');
        }
      } else {
        toast.error('Failed to load product');
        router.push('/manufacturer/products');
      }
    } catch (error) {
      console.error('Fetch product error:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleEdit = () => {
    router.push(`/manufacturer/products/add?id=${productId}`);
  };

  const handleDelete = async () => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        setDeleting(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const result = await response.json();

          if (response.ok && result.status === 'success') {
            toast.success('Product deleted successfully');
            router.push('/manufacturer/products');
          } else {
            throw new Error(result.message || 'Failed to delete product');
          }
        } catch (error) {
          console.error('Delete product error:', error);
          toast.error(error.message || 'Failed to delete product');
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const handleToggleVisibility = async () => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setProduct({ ...product, status: newStatus });
        toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Toggle visibility error:', error);
      toast.error(error.message || 'Failed to update product status');
    }
  };

  const viewAnalytics = () => {
    router.push(`/manufacturer/products/${productId}/analytics`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/manufacturer/products')}
            className="btn btn-primary"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const images = product.images?.map(img => img.imageUrl).filter(Boolean) || [];
  const videos = product.videos?.map(vid => vid.videoUrl).filter(Boolean) || [];
  const discount = product.mrp && product.mrp > (product.sellingPrice || product.costPrice || 0)
    ? Math.round(((product.mrp - (product.sellingPrice || product.costPrice || 0)) / product.mrp) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={viewAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              Analytics
            </button>
            <button
              onClick={handleToggleVisibility}
              className={product.status === 'active' ? 'btn btn-warning' : 'btn btn-success'}
            >
              {product.status === 'active' ? (
                <>
                  <EyeOff className="h-5 w-5" />
                  Deactivate
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5" />
                  Activate
                </>
              )}
            </button>
            <button
              onClick={handleEdit}
              className="btn btn-primary"
            >
              <Edit className="h-5 w-5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-danger"
            >
              {deleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Status Badge */}
        {product.status !== 'active' && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-800 dark:text-yellow-200 font-medium">
              This product is currently {product.status}
            </span>
          </div>
        )}

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {images[selectedImage] && !imageError ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-300 dark:text-gray-600" />
                </div>
              )}
              
              {/* Stock Badge */}
              {product.stockQuantity !== null && product.stockQuantity !== undefined && 
               product.stockQuantity <= 10 && product.stockQuantity > 0 && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-white text-sm font-bold px-3 py-1 rounded">
                  Only {product.stockQuantity} left
                </div>
              )}
              
              {product.stockQuantity === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-lg">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-blue-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              {product.brandName && (
                <p className="text-gray-600 dark:text-gray-400">
                  Brand: <span className="font-semibold">{product.brandName}</span>
                </p>
              )}
              {product.category?.name && (
                <p className="text-gray-600 dark:text-gray-400">
                  Category: <span className="font-semibold">{product.category.name}</span>
                </p>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(product.sellingPrice || product.costPrice || 0)}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                      {formatPrice(product.mrp)}
                    </span>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cost Price</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatPrice(product.costPrice || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Profit per Sale</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatPrice((product.sellingPrice || 0) - (product.costPrice || 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Inventory
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Stock</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {product.stockQuantity !== null && product.stockQuantity !== undefined ? product.stockQuantity : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">SKU</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {product.sku || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.viewsCount || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <Heart className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.savesCount || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Saves</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <Share2 className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.sharesCount || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Shares</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Videos */}
        {videos.length > 0 && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Product Videos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((videoUrl, index) => (
                  <div key={index} className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full object-cover"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Description & Specifications */}
        <div className="mt-8 grid md:grid-cols-2 gap-8">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Product Description
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
              {product.description || 'No description available.'}
            </p>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Specifications
              </h2>
              <dl className="space-y-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <dt className="font-medium text-gray-700 dark:text-gray-300">{key}</dt>
                    <dd className="text-gray-600 dark:text-gray-400">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
