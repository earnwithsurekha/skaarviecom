'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

const SWIPE_THRESHOLD = 40;

export default function ProductImageCarousel({
  images = [],
  productName,
  resetKey = '',
  imageFit = 'contain',
  children,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const touchStartX = useRef(null);
  const activeImage = images[selectedIndex];

  useEffect(() => {
    setSelectedIndex(0);
    setImageError(false);
  }, [resetKey]);

  useEffect(() => {
    if (selectedIndex >= images.length) setSelectedIndex(0);
  }, [images.length, selectedIndex]);

  useEffect(() => {
    setImageError(false);
  }, [activeImage?.url]);

  const showPrevious = () => {
    if (images.length < 2) return;
    setSelectedIndex((current) => (current - 1 + images.length) % images.length);
  };

  const showNext = () => {
    if (images.length < 2) return;
    setSelectedIndex((current) => (current + 1) % images.length);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    if (distance > 0) showPrevious();
    else showNext();
  };

  return (
    <div className="space-y-3">
      <section
        className="relative aspect-square overflow-hidden border"
        style={{
          backgroundColor: 'rgb(var(--color-surface))',
          borderColor: 'rgb(var(--color-border))',
        }}
        onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
        onTouchEnd={handleTouchEnd}
        aria-label={`${productName} image gallery`}
      >
        {activeImage && !imageError ? (
          <img
            src={activeImage.url}
            alt={`${productName} view ${selectedIndex + 1}`}
            className={`h-full w-full ${imageFit === 'cover' ? 'object-cover' : 'object-contain'}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-24 w-24" style={{ color: 'rgb(var(--color-text-secondary))' }} />
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Show previous product image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Show next product image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <span className="absolute bottom-3 right-3 rounded bg-black/65 px-2 py-1 text-xs font-medium text-white">
              {selectedIndex + 1} / {images.length}
            </span>
          </>
        )}

        {children}
      </section>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              type="button"
              key={`${image.url}-${index}`}
              onClick={() => setSelectedIndex(index)}
              className="h-20 w-20 flex-none overflow-hidden border-2 transition-colors"
              style={{
                backgroundColor: 'rgb(var(--color-surface))',
                borderColor: selectedIndex === index
                  ? 'rgb(var(--color-primary))'
                  : 'rgb(var(--color-border))',
              }}
              aria-label={`Show product image ${index + 1}`}
              aria-current={selectedIndex === index ? 'true' : undefined}
            >
              <img
                src={image.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}