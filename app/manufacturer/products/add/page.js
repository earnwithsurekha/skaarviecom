'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, X, FileText, Video, Image as ImageIcon } from 'lucide-react';
import {
  getProductSizeConfig,
  getVariantInventoryKey,
  PRODUCT_COLOR_PRESETS,
} from '@/lib/productSizeConfig';

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

const normalizeImageVariantKeys = (image) => {
  let variantKeys = [];
  if (Array.isArray(image.variantKeys)) {
    variantKeys = image.variantKeys;
  } else if (image.variantKey) {
    variantKeys = [image.variantKey];
  }

  if (variantKeys.length === 0) return [];
  const assignedColors = variantKeys.map((variantKey) => {
    const normalizedKey = String(variantKey).toLocaleLowerCase('en-IN');
    if (normalizedKey.startsWith('color:')) return normalizedKey.slice('color:'.length);
    if (normalizedKey.startsWith('size:')) return null;
    return normalizedKey.split('|')[1] || null;
  });
  const uniqueColors = new Set(assignedColors);

  if (!assignedColors.includes(null) && uniqueColors.size === 1) {
    return [`color:${assignedColors[0]}`];
  }
  return variantKeys;
};

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProductId = searchParams.get('id'); // Get product ID from URL for edit mode

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    productInfo: true,
    media: true,
    pricing: true,
    inventory: true,
    sizing: true,
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
    hasSizeVariants: false,
    sizeVariants: [],
    hasColorVariants: false,
    colorVariants: [],
    variantQuantities: {},
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    deliveryDays: '',
    shippingCharges: '',
    shippingInfo: '',
    status: 'draft',
  });

  // File upload state
  const [imageItems, setImageItems] = useState([]);
  const [videos, setVideos] = useState([]);
  const [catalog, setCatalog] = useState(null);
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
  const [mediaDirty, setMediaDirty] = useState(false);
  const [customSizeLabel, setCustomSizeLabel] = useState('');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#111827');

  const selectedCategory = categories.find((category) => category.id === formData.categoryId);
  const sizeConfig = getProductSizeConfig(selectedCategory?.slug);
  const usesSizeVariants = Boolean(
    sizeConfig && (sizeConfig.requirement === 'required' || formData.hasSizeVariants)
  );
  const usesColorVariants = formData.hasColorVariants;
  const usesProductVariants = usesSizeVariants || usesColorVariants;
  let configuredVariants = [];
  if (usesSizeVariants) {
    configuredVariants = formData.sizeVariants.flatMap((sizeLabel) => (
      usesColorVariants
        ? formData.colorVariants.map((color) => ({ sizeLabel, ...color }))
        : [{ sizeLabel, colorName: null, colorHex: null }]
    ));
  } else if (usesColorVariants) {
    configuredVariants = formData.colorVariants.map((color) => ({ sizeLabel: null, ...color }));
  }
  const productVariants = configuredVariants.map((variant) => ({
    ...variant,
    stockQuantity: Number.parseInt(
      formData.variantQuantities[getVariantInventoryKey(variant.sizeLabel, variant.colorName)],
      10
    ) || 0,
  }));
  const totalVariantStock = productVariants.reduce(
    (total, variant) => total + variant.stockQuantity,
    0
  );
  const mediaAssignmentOptions = [
    { value: '', label: 'All variants (general image)' },
    ...formData.colorVariants.map((color) => ({
      value: `color:${color.colorName.toLocaleLowerCase('en-IN')}`,
      label: `Color: ${color.colorName} (all sizes)`,
    })),
    ...formData.sizeVariants.map((sizeLabel) => ({
      value: `size:${sizeLabel.toLocaleLowerCase('en-IN')}`,
      label: `Size: ${sizeLabel} (all colors)`,
    })),
    ...productVariants.map((variant) => ({
      value: getVariantInventoryKey(variant.sizeLabel, variant.colorName).toLocaleLowerCase('en-IN'),
      label: `Exact: ${[variant.colorName, variant.sizeLabel].filter(Boolean).join(' / ')}`,
    })),
  ];
  const imageScopeOptions = [
    { value: '', label: 'General image (shown for every color)' },
    ...(usesColorVariants
      ? formData.colorVariants.map((color) => ({
          value: `color:${color.colorName.toLocaleLowerCase('en-IN')}`,
          label: `${color.colorName} only`,
        }))
      : formData.sizeVariants.map((sizeLabel) => ({
          value: `size:${sizeLabel.toLocaleLowerCase('en-IN')}`,
          label: `${sizeLabel} only`,
        }))),
  ];

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
  }, [formData, productId, mediaDirty]);

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

      const loadedVariants = productData.variants || [];
      const loadedSizes = [...new Set(
        loadedVariants.map((variant) => variant.sizeLabel).filter(Boolean)
      )];
      const loadedColors = loadedVariants
        .filter((variant) => variant.colorName)
        .filter((variant, index, allVariants) => (
          allVariants.findIndex((candidate) => candidate.colorName === variant.colorName) === index
        ))
        .map((variant) => ({
          colorName: variant.colorName,
          colorHex: variant.colorHex || '#64748b',
        }));
      const loadedVariantQuantities = Object.fromEntries(
        loadedVariants.map((variant) => [
          getVariantInventoryKey(variant.sizeLabel, variant.colorName),
          Number.parseInt(variant.stockQuantity, 10) || 0,
        ])
      );

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
        hasSizeVariants: loadedSizes.length > 0,
        sizeVariants: loadedSizes,
        hasColorVariants: loadedColors.length > 0,
        colorVariants: loadedColors,
        variantQuantities: loadedVariantQuantities,
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
        setImageItems(productData.images.map((image) => ({
          id: image.id,
          file: null,
          previewUrl: image.imageUrl,
          variantKeys: normalizeImageVariantKeys(image),
        })));
      }
      setMediaDirty(false);

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
    if (name === 'categoryId') {
      const nextSizeConfig = getProductSizeConfig(
        categories.find((category) => category.id === value)?.slug
      );
      setFormData((previous) => ({
        ...previous,
        categoryId: value,
        hasSizeVariants: nextSizeConfig?.requirement === 'required'
          ? true
          : nextSizeConfig?.requirement === 'optional' && previous.hasSizeVariants,
        sizeVariants: nextSizeConfig ? previous.sizeVariants : [],
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSize = (sizeLabel) => {
    setFormData((previous) => {
      const isSelected = previous.sizeVariants.includes(sizeLabel);
      return {
        ...previous,
        sizeVariants: isSelected
          ? previous.sizeVariants.filter((configuredSize) => configuredSize !== sizeLabel)
          : [...previous.sizeVariants, sizeLabel],
      };
    });
  };

  const updateVariantQuantity = (sizeLabel, colorName, stockQuantity) => {
    const variantKey = getVariantInventoryKey(sizeLabel, colorName);
    setFormData((previous) => ({
      ...previous,
      variantQuantities: {
        ...previous.variantQuantities,
        [variantKey]: stockQuantity,
      },
    }));
  };

  const addCustomSize = () => {
    const sizeLabel = customSizeLabel.trim();
    if (!sizeLabel) return;

    const alreadyExists = formData.sizeVariants.some(
      (configuredSize) => configuredSize.toLocaleLowerCase('en-IN') === sizeLabel.toLocaleLowerCase('en-IN')
    );
    if (alreadyExists) {
      setError(`Size "${sizeLabel}" is already configured`);
      return;
    }

    setFormData((previous) => ({
      ...previous,
      sizeVariants: [...previous.sizeVariants, sizeLabel],
    }));
    setCustomSizeLabel('');
    setError('');
  };

  const toggleColor = (color) => {
    setFormData((previous) => {
      const isSelected = previous.colorVariants.some((variant) => variant.colorName === color.colorName);
      return {
        ...previous,
        colorVariants: isSelected
          ? previous.colorVariants.filter((variant) => variant.colorName !== color.colorName)
          : [...previous.colorVariants, color],
      };
    });
  };

  const addCustomColor = () => {
    const colorName = customColorName.trim();
    if (!colorName) return;

    const alreadyExists = formData.colorVariants.some(
      (variant) => variant.colorName.toLocaleLowerCase('en-IN') === colorName.toLocaleLowerCase('en-IN')
    );
    if (alreadyExists) {
      setError(`Color "${colorName}" is already configured`);
      return;
    }

    setFormData((previous) => ({
      ...previous,
      colorVariants: [...previous.colorVariants, { colorName, colorHex: customColorHex }],
    }));
    setCustomColorName('');
    setError('');
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
  const handleImageChange = (e, requestedAssignment = '') => {
    const files = Array.from(e.target.files);
    
    if (imageItems.length + files.length > 30) {
      setError('Maximum 30 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    const assignmentExists = mediaAssignmentOptions.some(
      (option) => option.value === requestedAssignment
    );
    const uploadVariantKeys = assignmentExists && requestedAssignment
      ? [requestedAssignment]
      : [];
    const newImageItems = validFiles.map((file) => ({
      id: `new-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      variantKeys: uploadVariantKeys,
    }));
    setImageItems((previous) => [...previous, ...newImageItems]);
    setMediaDirty(true);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImageItems((previous) => {
      const removedImage = previous[index];
      if (removedImage?.file && removedImage.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }
      return previous.filter((_, imageIndex) => imageIndex !== index);
    });
    setMediaDirty(true);
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= imageItems.length) return;

    setImageItems((previous) => {
      const reorderedImages = [...previous];
      [reorderedImages[index], reorderedImages[targetIndex]] = [
        reorderedImages[targetIndex],
        reorderedImages[index],
      ];
      return reorderedImages;
    });
    setMediaDirty(true);
  };

  const setImageAssignment = (imageId, variantKey) => {
    setImageItems((previous) => previous.map((image) => (
      image.id === imageId
        ? {
            ...image,
            variantKeys: variantKey ? [variantKey] : [],
          }
        : image
    )));
    setMediaDirty(true);
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
    if (!productId || autoSaving || mediaDirty) return;

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
        if (!formData.name || !formData.categoryId || !formData.costPrice || (!usesProductVariants && formData.stockQuantity === '')) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (usesSizeVariants && formData.sizeVariants.length === 0) {
          setError('Select at least one size and enter its available quantity');
          setLoading(false);
          return;
        }
        if (usesColorVariants && formData.colorVariants.length === 0) {
          setError('Select at least one color and enter its available quantity');
          setLoading(false);
          return;
        }
      }

      const validMediaAssignmentKeys = new Set(mediaAssignmentOptions.map((option) => option.value));
      if (!isAutoSave && imageItems.some((image) => (
        image.variantKeys.some((variantKey) => !validMediaAssignmentKeys.has(variantKey))
      ))) {
        setError('One or more images reference a removed size or color. Reassign those images before saving.');
        setLoading(false);
        return;
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
        } else if (['sizeVariants', 'hasSizeVariants', 'colorVariants', 'hasColorVariants', 'variantQuantities'].includes(key)) {
          return;
        } else if (key === 'stockQuantity' && usesProductVariants) {
          submitData.append('stockQuantity', totalVariantStock.toString());
        } else if (formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      submitData.append(
        'variants',
        JSON.stringify(usesProductVariants ? productVariants : [])
      );

      // Set status
      if (submitForApproval) {
        submitData.set('status', 'pending_approval');
      } else {
        submitData.set('status', 'draft');
      }

      if (!isAutoSave) {
        const newImages = imageItems.filter((image) => image.file);
        const existingImages = imageItems.filter((image) => !image.file);
        const imagePositions = new Map(
          imageItems.map((image, index) => [image.id, index])
        );

        newImages.forEach((image) => {
          submitData.append('images', image.file);
        });
        submitData.append(
          'imageAssignments',
          JSON.stringify(newImages.map((image) => ({
            variantKeys: image.variantKeys,
            sortOrder: imagePositions.get(image.id),
          })))
        );
        if (productId) {
          submitData.append(
            'existingImageAssignments',
            JSON.stringify(existingImages.map((image) => ({
              id: image.id,
              variantKeys: image.variantKeys,
              sortOrder: imagePositions.get(image.id),
            })))
          );
        }

        videos.forEach(video => {
          submitData.append('videos', video);
        });
        if (catalog) {
          submitData.append('catalog', catalog);
        }
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
        const savedImages = response.data.data.product.images || [];
        imageItems.forEach((image) => {
          if (image.file && image.previewUrl.startsWith('blob:')) URL.revokeObjectURL(image.previewUrl);
        });
        setImageItems(savedImages.map((image) => ({
          id: image.id,
          file: null,
          previewUrl: image.imageUrl,
          variantKeys: normalizeImageVariantKeys(image),
        })));
        setMediaDirty(false);
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
            Product details auto-save every 30 seconds. Images and other media are uploaded only when you save the product.
          </p>
          {mediaDirty && (
            <p className="mt-1 text-xs font-medium" style={{ color: 'rgb(var(--color-warning))' }}>
              Unsaved media changes. Use Save Draft or Submit for Approval to upload them.
            </p>
          )}
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
                  Product Images (Max 30)
                </label>
                {usesColorVariants && formData.colorVariants.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                      Upload images for each existing color
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {formData.colorVariants.map((color, index) => {
                        const colorAssignment = `color:${color.colorName.toLocaleLowerCase('en-IN')}`;
                        const inputId = `color-image-upload-${index}`;
                        const assignedImageCount = imageItems.filter(
                          (image) => image.variantKeys.length === 1 && image.variantKeys[0] === colorAssignment
                        ).length;

                        return (
                          <div key={colorAssignment} className="border p-3" style={{ borderColor: 'rgb(var(--color-border))' }}>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(event) => handleImageChange(event, colorAssignment)}
                              className="hidden"
                              id={inputId}
                            />
                            <label
                              htmlFor={inputId}
                              className="flex min-h-11 cursor-pointer items-center gap-2 border px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5"
                              style={{
                                borderColor: 'rgb(var(--color-border))',
                                color: 'rgb(var(--color-text))',
                              }}
                            >
                              <span
                                className="h-4 w-4 rounded-full border"
                                style={{
                                  backgroundColor: color.colorHex,
                                  borderColor: 'rgb(var(--color-border))',
                                }}
                                aria-hidden="true"
                              />
                              <Plus size={16} />
                              Select multiple {color.colorName} images
                            </label>
                            <p className="mt-2 text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                              {assignedImageCount} {color.colorName} image{assignedImageCount === 1 ? '' : 's'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                      Upload general images shown for every color
                    </span>
                    <span className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Max 5MB per image</span>
                  </label>
                </div>

                {imageItems.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {imageItems.map((image, index) => {
                      const selectedLabels = mediaAssignmentOptions
                        .filter((option) => option.value && image.variantKeys.includes(option.value))
                        .map((option) => option.label);
                      const assignmentSummary = selectedLabels.length === 0
                        ? 'All variants (general image)'
                        : selectedLabels.length <= 2
                          ? selectedLabels.join(', ')
                          : `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;
                      const hasRemovedAssignment = image.variantKeys.some((variantKey) => (
                        !mediaAssignmentOptions.some((option) => option.value === variantKey)
                      ));
                      let imageScopeValue = '__existing__';
                      if (image.variantKeys.length === 0) {
                        imageScopeValue = '';
                      } else if (
                        image.variantKeys.length === 1
                        && imageScopeOptions.some((option) => option.value === image.variantKeys[0])
                      ) {
                        imageScopeValue = image.variantKeys[0];
                      }

                      return (
                        <div key={image.id} className="border p-3" style={{ borderColor: 'rgb(var(--color-border))' }}>
                          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                            <img
                              src={image.previewUrl}
                              alt={`Product preview ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full"
                              style={{ backgroundColor: 'rgb(var(--color-danger))', color: 'white' }}
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <X size={16} />
                            </button>
                            {index === 0 && (
                              <span className="absolute bottom-2 left-2 px-2 py-1 text-xs font-medium" style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}>
                                Primary
                              </span>
                            )}
                            <div className="absolute bottom-2 right-2 flex gap-1">
                              <button
                                type="button"
                                onClick={() => moveImage(index, -1)}
                                disabled={index === 0}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white disabled:cursor-not-allowed disabled:opacity-35"
                                title="Move image earlier"
                                aria-label={`Move image ${index + 1} earlier`}
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveImage(index, 1)}
                                disabled={index === imageItems.length - 1}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white disabled:cursor-not-allowed disabled:opacity-35"
                                title="Move image later"
                                aria-label={`Move image ${index + 1} later`}
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>

                          <label htmlFor={`image-scope-${image.id}`} className="mt-3 block text-xs font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            Show this image for
                          </label>
                          <select
                            id={`image-scope-${image.id}`}
                            value={imageScopeValue}
                            onChange={(event) => setImageAssignment(image.id, event.target.value)}
                            className="input mt-1 w-full"
                          >
                            {imageScopeValue === '__existing__' && (
                              <option value="__existing__" disabled>{assignmentSummary}</option>
                            )}
                            {imageScopeOptions.map((option) => (
                              <option key={option.value || 'general'} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          {hasRemovedAssignment && (
                            <p className="mt-2 text-xs" style={{ color: 'rgb(var(--color-danger))' }}>
                              A selected size or color was removed. Update this image assignment before saving.
                            </p>
                          )}
                        </div>
                      );
                    })}
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

              {sizeConfig && (
                <div className="border p-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                          {sizeConfig.title}
                        </h3>
                        <span
                          className="px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: 'rgb(var(--color-surface))',
                            color: 'rgb(var(--color-text-secondary))',
                          }}
                        >
                          {sizeConfig.requirement === 'required' ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        {sizeConfig.description}
                      </p>
                    </div>

                    {sizeConfig.requirement === 'optional' && (
                      <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                        <input
                          type="checkbox"
                          checked={formData.hasSizeVariants}
                          onChange={(event) => setFormData((previous) => ({
                            ...previous,
                            hasSizeVariants: event.target.checked,
                          }))}
                          className="h-4 w-4"
                        />
                        <span>Track stock by size</span>
                      </label>
                    )}
                  </div>

                  {usesSizeVariants && (
                    <div className="mt-5 space-y-5">
                      {sizeConfig.groups.map((group) => (
                        <div key={group.label}>
                          <p className="mb-2 text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.sizes.map((sizeLabel) => {
                              const selected = formData.sizeVariants.includes(sizeLabel);
                              return (
                                <button
                                  key={sizeLabel}
                                  type="button"
                                  onClick={() => toggleSize(sizeLabel)}
                                  className="min-h-10 border px-3 py-2 text-sm font-medium"
                                  style={{
                                    backgroundColor: selected ? 'rgb(var(--color-primary))' : 'rgb(var(--color-background))',
                                    borderColor: selected ? 'rgb(var(--color-primary))' : 'rgb(var(--color-border))',
                                    color: selected ? '#ffffff' : 'rgb(var(--color-text))',
                                  }}
                                  aria-pressed={selected}
                                >
                                  {sizeLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <div>
                        <p className="mb-2 text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                          Custom size
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={customSizeLabel}
                            onChange={(event) => setCustomSizeLabel(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                addCustomSize();
                              }
                            }}
                            className="input flex-1"
                            placeholder="Example: 52 in, EU 39, Ring 25"
                            maxLength={50}
                          />
                          <button type="button" onClick={addCustomSize} className="btn btn-outline">
                            <Plus size={18} /> Add Size
                          </button>
                        </div>
                      </div>

                      {formData.sizeVariants.length === 0 && (
                        <p className="text-sm" style={{ color: 'rgb(var(--color-danger))' }}>
                          No sizes configured yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="border p-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                        Color variants
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgb(var(--color-surface))', color: 'rgb(var(--color-text-secondary))' }}>
                        Optional
                      </span>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Enable colors and track stock for each color or size-and-color combination.
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                    <input
                      type="checkbox"
                      checked={formData.hasColorVariants}
                      onChange={(event) => setFormData((previous) => ({
                        ...previous,
                        hasColorVariants: event.target.checked,
                      }))}
                      className="h-4 w-4"
                    />
                    <span>Track stock by color</span>
                  </label>
                </div>

                {usesColorVariants && (
                  <div className="mt-5 space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {PRODUCT_COLOR_PRESETS.map((color) => {
                        const selected = formData.colorVariants.some((variant) => variant.colorName === color.colorName);
                        return (
                          <button
                            key={color.colorName}
                            type="button"
                            onClick={() => toggleColor(color)}
                            className="flex min-h-10 items-center gap-2 border px-3 py-2 text-sm font-medium"
                            style={{
                              backgroundColor: selected ? 'rgb(var(--color-primary))' : 'rgb(var(--color-background))',
                              borderColor: selected ? 'rgb(var(--color-primary))' : 'rgb(var(--color-border))',
                              color: selected ? '#ffffff' : 'rgb(var(--color-text))',
                            }}
                            aria-pressed={selected}
                          >
                            <span className="h-5 w-5 rounded-full border border-black/20" style={{ backgroundColor: color.colorHex }} aria-hidden="true" />
                            {color.colorName}
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                        Custom color
                      </p>
                      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-2 sm:grid-cols-[48px_minmax(0,1fr)_auto]">
                        <input
                          type="color"
                          value={customColorHex}
                          onChange={(event) => setCustomColorHex(event.target.value)}
                          className="h-10 w-12 cursor-pointer border p-1"
                          style={{ borderColor: 'rgb(var(--color-border))' }}
                          aria-label="Custom color swatch"
                        />
                        <input
                          type="text"
                          value={customColorName}
                          onChange={(event) => setCustomColorName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addCustomColor();
                            }
                          }}
                          className="input"
                          placeholder="Example: Sky Blue"
                          maxLength={50}
                        />
                        <button type="button" onClick={addCustomColor} className="btn btn-outline col-span-2 sm:col-span-1">
                          <Plus size={18} /> Add Color
                        </button>
                      </div>
                    </div>

                    {formData.colorVariants.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.colorVariants.map((color) => (
                          <button
                            key={color.colorName}
                            type="button"
                            onClick={() => toggleColor(color)}
                            className="flex items-center gap-2 border px-3 py-2 text-sm"
                            style={{ borderColor: 'rgb(var(--color-border))', color: 'rgb(var(--color-text))' }}
                            title={`Remove ${color.colorName}`}
                          >
                            <span className="h-5 w-5 rounded-full border border-black/20" style={{ backgroundColor: color.colorHex }} aria-hidden="true" />
                            {color.colorName}
                            <X size={14} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'rgb(var(--color-danger))' }}>
                        No colors configured yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {usesProductVariants && productVariants.length > 0 && (
                <div className="border p-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <div className="mb-3">
                    <h3 className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>Variant inventory</h3>
                    <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Enter the available quantity for every combination you sell.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3 text-xs font-medium uppercase" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      <span>Variant</span>
                      <span>Quantity</span>
                    </div>
                    {productVariants.map((variant) => {
                      const variantKey = getVariantInventoryKey(variant.sizeLabel, variant.colorName);
                      return (
                        <div key={variantKey} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 border-t pt-2" style={{ borderColor: 'rgb(var(--color-border))' }}>
                          <div className="flex min-w-0 items-center gap-2">
                            {variant.colorName && (
                              <span className="h-5 w-5 flex-none rounded-full border border-black/20" style={{ backgroundColor: variant.colorHex }} aria-hidden="true" />
                            )}
                            <span className="truncate font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                              {[variant.colorName, variant.sizeLabel].filter(Boolean).join(' / ')}
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.variantQuantities[variantKey] ?? ''}
                            onChange={(event) => updateVariantQuantity(variant.sizeLabel, variant.colorName, event.target.value)}
                            className="input"
                            aria-label={`Stock quantity for ${[variant.colorName, variant.sizeLabel].filter(Boolean).join(' / ')}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                    {usesProductVariants ? 'Total Stock' : 'Stock Quantity'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={usesProductVariants ? totalVariantStock : formData.stockQuantity}
                    onChange={handleInputChange}
                    min="0"
                    className="input"
                    placeholder="0"
                    readOnly={usesProductVariants}
                    required
                  />
                  {usesProductVariants && (
                    <p className="mt-1 text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Calculated from the configured variant quantities.
                    </p>
                  )}
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
