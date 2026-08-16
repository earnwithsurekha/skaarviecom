'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Download, Image as ImageIcon, Video, FileText, Palette,
  Package, Search, Filter, Check, FolderOpen, Grid3x3,
  List, Eye, Loader2, AlertCircle
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function MediaDownloadCenterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch products with media
      const productsResponse = await fetch('/api/reseller/products?limit=100');
      const productsData = await productsResponse.json();
      
      if (productsData.status === 'success') {
        setProducts(productsData.data.products);
        setFilteredProducts(productsData.data.products);
      }

      // Fetch categories
      const categoriesResponse = await fetch('/api/categories');
      const categoriesData = await categoriesResponse.json();
      
      if (categoriesData.status === 'success') {
        setCategories(categoriesData.data.allCategories || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const downloadImage = async (imageUrl, productName, index) => {
    setDownloading(prev => ({ ...prev, [`img-${index}`]: true }));
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${productName.replace(/[^a-z0-9]/gi, '-')}-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setDownloading(prev => ({ ...prev, [`img-${index}`]: false }));
    }
  };

  const downloadAllImages = async (product) => {
    setDownloading(prev => ({ ...prev, [`all-${product.id}`]: true }));
    try {
      const response = await fetch(`/api/reseller/products/${product.id}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.data.images) {
        for (let i = 0; i < data.data.images.length; i++) {
          await downloadImage(data.data.images[i].image_url, product.name, i);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error downloading all images:', error);
    } finally {
      setDownloading(prev => ({ ...prev, [`all-${product.id}`]: false }));
    }
  };

  const downloadVideo = async (videoUrl, productName, index) => {
    setDownloading(prev => ({ ...prev, [`vid-${index}`]: true }));
    try {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `${productName.replace(/[^a-z0-9]/gi, '-')}-video-${index + 1}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading video:', error);
    } finally {
      setDownloading(prev => ({ ...prev, [`vid-${index}`]: false }));
    }
  };

  const generateProductPDF = async (product) => {
    setDownloading(prev => ({ ...prev, [`pdf-${product.id}`]: true }));
    try {
      const response = await fetch(`/api/reseller/media/generate-pdf/${product.id}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${product.name.replace(/[^a-z0-9]/gi, '-')}-catalog.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(prev => ({ ...prev, [`pdf-${product.id}`]: false }));
    }
  };

  const viewProductMedia = async (product) => {
    try {
      const response = await fetch(`/api/reseller/products/${product.id}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setSelectedProduct({
          ...data.data.product,
          images: data.data.images || [],
          videos: data.data.videos || []
        });
      }
    } catch (error) {
      console.error('Error fetching product media:', error);
    }
  };

  const clearSelection = () => {
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
          Media Download Center
        </h1>
        <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
          Download product images, videos, and catalogs to promote products effectively
        </p>
      </div>

      {/* Filters & Search */}
      <div 
        className="p-6 rounded-lg mb-6"
        style={{ backgroundColor: 'rgb(var(--color-surface))' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" 
              style={{ color: 'rgb(var(--color-text) / 0.5)' }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 rounded-lg outline-none"
              style={{ 
                backgroundColor: 'rgb(var(--color-background))',
                border: '1px solid rgb(var(--color-border))',
                color: 'rgb(var(--color-text))'
              }}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" 
              style={{ color: 'rgb(var(--color-text) / 0.5)' }} 
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg outline-none appearance-none"
              style={{ 
                backgroundColor: 'rgb(var(--color-background))',
                border: '1px solid rgb(var(--color-border))',
                color: 'rgb(var(--color-text))'
              }}
            >
              <option value="">All Categories</option>
              {categories && categories.length > 0 && categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.category_name}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                viewMode === 'grid' ? 'font-medium' : ''
              }`}
              style={{ 
                backgroundColor: viewMode === 'grid' 
                  ? 'rgb(var(--color-primary))' 
                  : 'rgb(var(--color-background))',
                color: viewMode === 'grid' 
                  ? 'white' 
                  : 'rgb(var(--color-text))',
                border: '1px solid rgb(var(--color-border))'
              }}
            >
              <Grid3x3 className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                viewMode === 'list' ? 'font-medium' : ''
              }`}
              style={{ 
                backgroundColor: viewMode === 'list' 
                  ? 'rgb(var(--color-primary))' 
                  : 'rgb(var(--color-background))',
                color: viewMode === 'list' 
                  ? 'white' 
                  : 'rgb(var(--color-text))',
                border: '1px solid rgb(var(--color-border))'
              }}
            >
              <List className="w-5 h-5 mx-auto" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
          <span>{filteredProducts.length} products found</span>
        </div>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-lg overflow-hidden transition-all hover:shadow-lg"
                style={{ 
                  backgroundColor: 'rgb(var(--color-surface))',
                  border: '1px solid rgb(var(--color-border))'
                }}
              >
                {/* Product Image */}
                <div 
                  className="relative h-48 overflow-hidden"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                >
                  {product.primary_image ? (
                    <img
                      src={product.primary_image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: 'rgb(var(--color-text))' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    {product.category_name || 'Uncategorized'}
                  </p>

                  {/* Download Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => viewProductMedia(product)}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-primary) / 0.1)',
                        color: 'rgb(var(--color-primary))'
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View</span>
                    </button>
                    <button
                      onClick={() => downloadAllImages(product)}
                      disabled={downloading[`all-${product.id}`]}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-primary))',
                        color: 'white'
                      }}
                    >
                      {downloading[`all-${product.id}`] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">All</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-lg p-4 flex items-center gap-4"
                style={{ 
                  backgroundColor: 'rgb(var(--color-surface))',
                  border: '1px solid rgb(var(--color-border))'
                }}
              >
                {/* Product Image */}
                <div 
                  className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                >
                  {product.primary_image ? (
                    <img
                      src={product.primary_image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    {product.category_name || 'Uncategorized'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewProductMedia(product)}
                    className="py-2 px-4 rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-primary) / 0.1)',
                      color: 'rgb(var(--color-primary))'
                    }}
                  >
                    View Media
                  </button>
                  <button
                    onClick={() => downloadAllImages(product)}
                    disabled={downloading[`all-${product.id}`]}
                    className="py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-primary))',
                      color: 'white'
                    }}
                  >
                    {downloading[`all-${product.id}`] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download All
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div 
          className="rounded-lg p-12 text-center"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <FolderOpen className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            No Products Found
          </h3>
          <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Media Viewer Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={clearSelection}
        >
          <div 
            className="rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'rgb(var(--color-surface))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  {selectedProduct.name}
                </h2>
                <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  Download all media assets for this product
                </p>
              </div>
              <button
                onClick={clearSelection}
                className="p-2 rounded-lg hover:opacity-70"
                style={{ color: 'rgb(var(--color-text))' }}
              >
                ✕
              </button>
            </div>

            {/* Product Images Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'rgb(var(--color-text))' }}>
                  <ImageIcon className="w-5 h-5" />
                  Product Images ({selectedProduct.images?.length || 0})
                </h3>
                {selectedProduct.images?.length > 0 && (
                  <button
                    onClick={() => downloadAllImages(selectedProduct)}
                    disabled={downloading[`all-${selectedProduct.id}`]}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-primary))',
                      color: 'white'
                    }}
                  >
                    {downloading[`all-${selectedProduct.id}`] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download All Images
                      </>
                    )}
                  </button>
                )}
              </div>

              {selectedProduct.images?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedProduct.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden group"
                      style={{ backgroundColor: 'rgb(var(--color-background))' }}
                    >
                      <img
                        src={image.image_url}
                        alt={`Product ${index + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => downloadImage(image.image_url, selectedProduct.name, index)}
                          disabled={downloading[`img-${index}`]}
                          className="p-3 rounded-full disabled:opacity-50"
                          style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
                        >
                          {downloading[`img-${index}`] ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Download className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className="p-8 rounded-lg text-center"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                >
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
                  <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    No images available
                  </p>
                </div>
              )}
            </div>

            {/* Product Videos Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'rgb(var(--color-text))' }}>
                  <Video className="w-5 h-5" />
                  Product Videos ({selectedProduct.videos?.length || 0})
                </h3>
              </div>

              {selectedProduct.videos?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProduct.videos.map((video, index) => (
                    <div
                      key={index}
                      className="rounded-lg overflow-hidden"
                      style={{ backgroundColor: 'rgb(var(--color-background))' }}
                    >
                      <video
                        src={video.video_url}
                        controls
                        className="w-full aspect-video"
                      />
                      <div className="p-3">
                        <button
                          onClick={() => downloadVideo(video.video_url, selectedProduct.name, index)}
                          disabled={downloading[`vid-${index}`]}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg disabled:opacity-50"
                          style={{ 
                            backgroundColor: 'rgb(var(--color-primary))',
                            color: 'white'
                          }}
                        >
                          {downloading[`vid-${index}`] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download Video
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className="p-8 rounded-lg text-center"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                >
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
                  <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    No videos available
                  </p>
                </div>
              )}
            </div>

            {/* Product Catalog PDF */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'rgb(var(--color-text))' }}>
                  <FileText className="w-5 h-5" />
                  Product Catalog
                </h3>
              </div>

              <div 
                className="p-6 rounded-lg"
                style={{ backgroundColor: 'rgb(var(--color-background))' }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgb(var(--color-primary) / 0.1)' }}
                  >
                    <FileText className="w-8 h-8" style={{ color: 'rgb(var(--color-primary))' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                      {selectedProduct.name} - Product Catalog
                    </p>
                    <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                      Complete product information with images and specifications
                    </p>
                  </div>
                  <button
                    onClick={() => generateProductPDF(selectedProduct)}
                    disabled={downloading[`pdf-${selectedProduct.id}`]}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg disabled:opacity-50 whitespace-nowrap"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-primary))',
                      color: 'white'
                    }}
                  >
                    {downloading[`pdf-${selectedProduct.id}`] ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Generate PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div 
        className="mt-8 p-6 rounded-lg"
        style={{ backgroundColor: 'rgb(var(--color-surface))' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
          💡 Download Center Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              📸 Product Images
            </h4>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              Download high-quality product images to share on social media or with customers
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              🎥 Product Videos
            </h4>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              Download product demonstration videos for better customer engagement
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              📄 Product Catalogs
            </h4>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              Generate PDF catalogs with complete product information and specifications
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              🎨 Marketing Materials
            </h4>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              All assets are optimized for digital marketing and social media sharing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
