'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import api from '@/lib/api';
import { ChevronDown, ChevronUp, Plus, X, Upload, FileText, Video, Image as ImageIcon } from 'lucide-react';

// Section component moved outside to prevent re-creation on every render
const Section = ({ title, name, isOpen, onToggle, children }) => (
  <div className="border rounded-lg mb-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
    <button
      type="button"
      onClick={() => onToggle(name)}
      className="w-full flex items-center justify-between p-4 rounded-t-lg transition-colors hover:opacity-90"
      style={{ backgroundColor: 'rgb(var(--color-surface))' }}
    >
      <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>{title}</h2>
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
    {isOpen && (
      <div className="p-6">
        {children}
      </div>
    )}
  </div>
);

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const editProductId = searchParams.get('id'); // Get product ID from URL for edit mode

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    productInfo: true,
    media: true,
    pricing: true,
    inventory: true,
    shipping: true,
  });

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    brandName: '',
    sku: '',
    description: '',
    specifications: [],
    costPrice: '',
    stockQuantity: '',
    lowStockThreshold: 10,
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    deliveryDays: '',
    shippingCharges: '',
    shippingInfo: '',
    status: 'draft',
  });

  // File upload state
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  // UI state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skuChecking, setSkuChecking] = useState(false);
  const [skuAvailable, setSkuAvailable] = useState(null);
  const [productId, setProductId] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Load product data for editing
  useEffect(() => {
    if (editProductId) {
      loadProductForEdit(editProductId);
    }
  }, [editProductId]);

  // Auto-save functionality
  useEffect(() => {
    if (!productId) return; // Only auto-save after initial creation

    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [formData, productId]);

  const loadProductForEdit = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/products/${id}`);
      const productData = response.data.data.product || response.data.data;

      // Convert specifications from object to array format
      let specificationsArray = [];
      if (productData.specifications) {
        if (Array.isArray(productData.specifications)) {
          specificationsArray = productData.specifications;
        } else if (typeof productData.specifications === 'object') {
          // Convert object {Color: 'Red', Size: 'Large'} to array [{key: 'Color', value: 'Red'}, ...]
          specificationsArray = Object.entries(productData.specifications).map(([key, value]) => ({ key, value }));
        }
      }

      // Set form data from loaded product
      setFormData({
        name: productData.name || '',
        categoryId: productData.categoryId || '',
        brandName: productData.brandName || '',
        sku: productData.sku || '',
        description: productData.description || '',
        specifications: specificationsArray,
        costPrice: productData.costPrice || '',
        stockQuantity: productData.stockQuantity || '',
        lowStockThreshold: productData.lowStockThreshold || 10,
        weight: productData.weight || '',
        dimensions: productData.dimensions || { length: '', width: '', height: '' },
        deliveryDays: productData.deliveryDays || '',
        shippingCharges: productData.shippingCharges || '',
        shippingInfo: productData.shippingInfo || '',
        status: productData.status || 'draft',
      });

      // Set product ID for update mode
      setProductId(id);

      // Load existing images
      if (productData.images && productData.images.length > 0) {
        const existingImages = productData.images.map(img => img.imageUrl);
        setImagePreviews(existingImages);
      }

      // Load existing videos
      if (productData.videos && productData.videos.length > 0) {
        const existingVideos = productData.videos.map(vid => vid.videoUrl);
        setVideoPreviews(existingVideos);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      setError('Failed to load product for editing');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data.data.allCategories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories');
    }
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDimensionChange = (dimension, value) => {
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dimension]: value }
    }));
  };

  // Specification management
  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const updateSpecification = (index, field, value) => {
    setFormData(prev => {
      const newSpecs = [...prev.specifications];
      newSpecs[index][field] = value;
      return { ...prev, specifications: newSpecs };
    });
  };

  const removeSpecification = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  // Image handling
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Video handling
  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (videos.length + files.length > 3) {
      setError('Maximum 3 videos allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        setError(`${file.name} is larger than 50MB`);
        return false;
      }
      return true;
    });

    setVideos(prev => [...prev, ...validFiles]);

    // Create video previews (just show file names)
    setVideoPreviews(prev => [...prev, ...validFiles.map(f => f.name)]);
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Catalog handling
  const handleCatalogChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Catalog PDF must be less than 10MB');
        return;
      }
      setCatalog(file);
    }
  };

  // SKU availability check
  const checkSkuAvailability = async () => {
    if (!formData.sku) return;

    setSkuChecking(true);
    try {
      // This would be a real API call to check SKU
      // For now, simulating with timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      setSkuAvailable(true); // Simulated result
    } catch (error) {
      setSkuAvailable(false);
    } finally {
      setSkuChecking(false);
    }
  };

  // Auto-save handler
  const handleAutoSave = async () => {
    if (!productId || autoSaving) return;

    setAutoSaving(true);
    try {
      await handleSubmit(true); // Pass true for auto-save mode
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  // Form submission
  const handleSubmit = async (isAutoSave = false, submitForApproval = false) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!isAutoSave) {
        if (!formData.name || !formData.categoryId || !formData.costPrice || !formData.stockQuantity) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }
      }

      // Prepare form data for multipart upload
      const submitData = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key === 'specifications') {
          // Convert specifications array to JSON object
          const specsObj = {};
          formData.specifications.forEach(spec => {
            if (spec.key && spec.value) {
              specsObj[spec.key] = spec.value;
            }
          });
          submitData.append('specifications', JSON.stringify(specsObj));
        } else if (key === 'dimensions') {
          submitData.append('dimensions', JSON.stringify(formData.dimensions));
        } else if (formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      // Set status
      if (submitForApproval) {
        submitData.set('status', 'pending_approval');
      } else {
        submitData.set('status', 'draft');
      }

      // Add images
      images.forEach(image => {
        submitData.append('images', image);
      });

      // Add videos
      videos.forEach(video => {
        submitData.append('videos', video);
      });

      // Add catalog
      if (catalog) {
        submitData.append('catalog', catalog);
      }

      // Submit to API
      let response;
      if (productId && isAutoSave) {
        // Update existing product (auto-save)
        response = await api.put(`/api/products/${productId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (productId) {
        // Update existing product (manual save)
        response = await api.put(`/api/products/${productId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Create new product
        response = await api.post('/api/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setProductId(response.data.data.product.id);
      }

      if (!isAutoSave) {
        setSuccess(submitForApproval ? 'Product submitted for approval!' : 'Product saved as draft!');
        
        if (submitForApproval) {
          setTimeout(() => {
            router.push('/manufacturer/products');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      if (!isAutoSave) {
        setError(error.response?.data?.message || 'Failed to save product');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            {editProductId ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Fill in the product details below. Changes are auto-saved every 30 seconds.
          </p>
          {lastSaved && (
            <p className="mt-1 text-xs" style={{ color: 'rgb(var(--color-success))' }}>
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
          {autoSaving && (
            <p className="mt-1 text-xs" style={{ color: 'rgb(var(--color-primary))' }}>
              Saving...
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 border rounded-lg" style={{ backgroundColor: 'rgba(var(--color-danger), 0.1)', borderColor: 'rgb(var(--color-danger))', color: 'rgb(var(--color-danger))' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 border rounded-lg" style={{ backgroundColor: 'rgba(var(--color-success), 0.1)', borderColor: 'rgb(var(--color-success))', color: 'rgb(var(--color-success))' }}>
            {success}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Product Information Section */}
          <Section title="Product Information" name="productInfo" isOpen={openSections.productInfo} onToggle={toggleSection}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="input"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>Brand Name</label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter brand name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>SKU Code</label>
                <div className="relative">
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    onBlur={checkSkuAvailability}
                    className="input"
                    placeholder="Enter SKU code"
                  />
                  {skuChecking && (
                    <span className="absolute right-3 top-3 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>Checking...</span>
                  )}
                  {skuAvailable === true && (
                    <span className="absolute right-3 top-3 text-sm" style={{ color: 'rgb(var(--color-success))' }}>✓ Available</span>
                  )}
                  {skuAvailable === false && (
                    <span className="absolute right-3 top-3 text-sm" style={{ color: 'rgb(var(--color-danger))' }}>✗ Already taken</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>Product Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input"
                  placeholder="Describe your product..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>Product Specifications</label>
                  <button
                    type="button"
                    onClick={addSpecification}
                    className="flex items-center gap-1 text-sm transition-colors hover:opacity-70"
                    style={{ color: 'rgb(var(--color-primary))' }}
                  >
                    <Plus size={16} /> Add Specification
                  </button>
                </div>
                <div className="space-y-2">
                  {Array.isArray(formData.specifications) && formData.specifications.map((spec, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                        placeholder="Key (e.g., Color)"
                        className="flex-1 input"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                        placeholder="Value (e.g., Red)"
                        className="flex-1 input"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        className="p-2 transition-colors hover:opacity-70"
                        style={{ color: 'rgb(var(--color-danger))' }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Media Section */}
          <Section title="Product Media" name="media" isOpen={openSections.media} onToggle={toggleSection}>
            <div className="space-y-6">
              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  Product Images (Max 10)
                </label>
                <div className="border-2 border-dashed rounded-lg p-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <ImageIcon size={48} className="mb-2" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                    <span className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Click to upload images (JPEG, PNG, WEBP, GIF)
                    </span>
                    <span className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Max 5MB per image</span>
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: 'rgb(var(--color-danger))', color: 'white' }}
                        >
                          <X size={14} />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 px-2 py-0.5 text-xs rounded" style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}>
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  Product Videos (Max 3)
                </label>
                <div className="border-2 border-dashed rounded-lg p-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleVideoChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Video size={48} className="mb-2" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                    <span className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Click to upload videos (MP4, MOV, AVI)
                    </span>
                    <span className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Max 50MB per video</span>
                  </label>
                </div>

                {videoPreviews.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {videoPreviews.map((videoItem, index) => {
                      const isUrl = typeof videoItem === 'string' && videoItem.startsWith('http');
                      return (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                          {isUrl ? (
                            <div className="flex items-center gap-2 flex-1">
                              <video src={videoItem} className="w-32 h-20 object-cover rounded" />
                              <span className="text-sm">Video {index + 1}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Video size={20} style={{ color: 'rgb(var(--color-text-secondary))' }} />
                              <span className="text-sm">{videoItem}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="p-1 text-red-600 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Catalog PDF */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  Product Catalog (PDF)
                </label>
                <div className="border-2 border-dashed rounded-lg p-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleCatalogChange}
                    className="hidden"
                    id="catalog-upload"
                  />
                  <label
                    htmlFor="catalog-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <FileText size={48} className="mb-2" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                    <span className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Click to upload catalog PDF
                    </span>
                    <span className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Max 10MB</span>
                  </label>
                </div>

                {catalog && (
                  <div className="mt-4 flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                    <div className="flex items-center gap-2">
                      <FileText size={20} style={{ color: 'rgb(var(--color-danger))' }} />
                      <span className="text-sm">{catalog.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCatalog(null)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Pricing & Inventory Section */}
          <Section title="Pricing & Inventory" name="pricing" isOpen={openSections.pricing} onToggle={toggleSection}>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                  <strong>Note:</strong> You only need to provide the manufacturer price. Skaarvi admin will set the final selling price, MRP, and margins for resellers.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  Manufacturer Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="input"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Enter the price at which you'll supply this product to Skaarvi
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    min="0"
                    className="input"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                    Low Stock Alert Level
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleInputChange}
                    min="0"
                    className="input"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Shipping Information Section */}
          <Section title="Shipping Information" name="shipping" isOpen={openSections.shipping} onToggle={toggleSection}>
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>Delivery Time (days)</label>
                  <input
                    type="number"
                    name="deliveryDays"
                    value={formData.deliveryDays}
                    onChange={handleInputChange}
                    min="0"
                    className="input"
                    placeholder="7"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>Dimensions (cm)</label>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    value={formData.dimensions.length}
                    onChange={(e) => handleDimensionChange('length', e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="Length"
                    className="input"
                  />
                  <input
                    type="number"
                    value={formData.dimensions.width}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="Width"
                    className="input"
                  />
                  <input
                    type="number"
                    value={formData.dimensions.height}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="Height"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>Shipping Charges (₹)</label>
                <input
                  type="number"
                  name="shippingCharges"
                  value={formData.shippingCharges}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>Shipping Information</label>
                <textarea
                  name="shippingInfo"
                  value={formData.shippingInfo}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Additional shipping details..."
                />
              </div>
            </div>
          </Section>

          {/* Action Buttons */}
          <div className="sticky bottom-0 border-t p-4 flex gap-4 justify-end" style={{ backgroundColor: 'rgb(var(--color-background))', borderColor: 'rgb(var(--color-border))' }}>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false, false)}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false, true)}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
