'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Package, Truck } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductImageCarousel from '@/components/product/ProductImageCarousel';

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const parseSpecifications = (specifications) => {
  if (!specifications) return {};
  if (typeof specifications === 'object') return specifications;
  try {
    return JSON.parse(specifications);
  } catch {
    return {};
  }
};

export default function ResellerProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [variants, setVariants] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');
        const response = await fetch(`/api/reseller/products/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok || result.status !== 'success') {
          throw new Error(result.message || 'Failed to load product details');
        }

        setProduct(result.data.product);
        setImages((result.data.images || []).map((image) => ({
          ...image,
          url: image.image_url,
        })));
        setVideos(result.data.videos || []);
        setVariants(result.data.variants || []);
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProductDetails();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="mb-4 text-2xl font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
          {errorMessage || 'Product not found'}
        </h1>
        <button
          type="button"
          onClick={() => router.push('/reseller/products')}
          className="px-4 py-2"
          style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
        >
          Back to Products
        </button>
      </div>
    );
  }

  const specifications = parseSpecifications(product.specifications);
  const stockQuantity = Number(product.stock_quantity) || 0;
  const stockText = stockQuantity > 10
    ? 'In Stock'
    : stockQuantity > 0
      ? `Low Stock (${stockQuantity})`
      : 'Out of Stock';
  const stockColor = stockQuantity > 10
    ? 'rgb(22, 163, 74)'
    : stockQuantity > 0
      ? 'rgb(234, 88, 12)'
      : 'rgb(220, 38, 38)';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => router.push('/reseller/products')}
        className="mb-6 flex items-center gap-2 px-3 py-2"
        style={{ color: 'rgb(var(--color-text-secondary))' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <ProductImageCarousel images={images} productName={product.name} />

          {videos.length > 0 && (
            <section aria-labelledby="product-videos-heading">
              <h2 id="product-videos-heading" className="mb-3 text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                Product Videos
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {videos.map((video) => (
                  <video key={video.video_url} controls className="aspect-video w-full bg-black">
                    <source src={video.video_url} />
                    <track kind="captions" />
                  </video>
                ))}
              </div>
            </section>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium" style={{ color: 'rgb(var(--color-primary))' }}>
            {product.category_name || 'Uncategorized'}
          </p>
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>{product.name}</h1>
          {product.manufacturer_name && (
            <p className="mt-2 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              by {product.manufacturer_name}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-4 border-y py-5" style={{ borderColor: 'rgb(var(--color-border))' }}>
            <div>
              <dt className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>Selling Price</dt>
              <dd className="mt-1 text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                {formatCurrency(product.selling_price)}
              </dd>
            </div>
            <div>
              <dt className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>Reseller Margin</dt>
              <dd className="mt-1 text-2xl font-bold" style={{ color: 'rgb(22, 163, 74)' }}>
                {formatCurrency(product.reseller_profit)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" style={{ color: stockColor }} />
              <span className="font-medium" style={{ color: stockColor }}>{stockText}</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              <Truck className="h-5 w-5" />
              <span>{product.delivery_days ? `${product.delivery_days} day delivery` : 'Delivery information not provided'}</span>
            </div>
          </div>

          {variants.length > 0 && (
            <section className="mt-8" aria-labelledby="variants-heading">
              <h2 id="variants-heading" className="mb-3 text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                Available Variants
              </h2>
              <div className="overflow-x-auto border" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <table className="w-full text-left text-sm">
                  <thead style={{ backgroundColor: 'rgb(var(--color-background))' }}>
                    <tr>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.id} className="border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
                        <td className="px-4 py-3">{variant.color_name || 'Any'}</td>
                        <td className="px-4 py-3">{variant.size_label || 'Any'}</td>
                        <td className="px-4 py-3">{variant.stock_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-8 border-t pt-8 lg:grid-cols-2" style={{ borderColor: 'rgb(var(--color-border))' }}>
        <section aria-labelledby="description-heading">
          <h2 id="description-heading" className="mb-3 text-xl font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
            Description
          </h2>
          <p className="whitespace-pre-wrap" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            {product.description || 'No description available.'}
          </p>
        </section>

        <section aria-labelledby="specifications-heading">
          <h2 id="specifications-heading" className="mb-3 text-xl font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
            Specifications
          </h2>
          {Object.keys(specifications).length > 0 ? (
            <dl className="divide-y" style={{ borderColor: 'rgb(var(--color-border))' }}>
              {Object.entries(specifications).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4 py-2">
                  <dt className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>{key}</dt>
                  <dd className="col-span-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p style={{ color: 'rgb(var(--color-text-secondary))' }}>No specifications available.</p>
          )}
        </section>

        <section className="lg:col-span-2" aria-labelledby="shipping-heading">
          <h2 id="shipping-heading" className="mb-3 flex items-center gap-2 text-xl font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
            <FileText className="h-5 w-5" />
            Shipping Information
          </h2>
          <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
            {product.shipping_info || 'Shipping information not provided.'}
          </p>
        </section>
      </div>
    </div>
  );
}