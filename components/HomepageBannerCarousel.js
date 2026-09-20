'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';

const AUTOPLAY_DELAY = 5500;
const SWIPE_THRESHOLD = 45;

const getBannerHref = (banner) => {
  if (banner.link_url) return banner.link_url;
  if (banner.link_type === 'product' && banner.link_id) return `/products/${banner.link_id}`;
  if (banner.link_type === 'category' && banner.link_id) return `/?category=${banner.link_id}`;
  return null;
};

const trackBannerEvent = (bannerId, event) => {
  fetch('/api/public/banners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bannerId, event }),
    keepalive: true,
  }).catch(() => {});
};

export default function HomepageBannerCarousel({ banners }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const viewedBanners = useRef(new Set());
  const touchStartX = useRef(null);

  const bannerCount = banners.length;
  const activeBanner = banners[activeIndex];

  useEffect(() => {
    if (activeIndex >= bannerCount) {
      setActiveIndex(0);
    }
  }, [activeIndex, bannerCount]);

  useEffect(() => {
    if (!activeBanner || viewedBanners.current.has(activeBanner.id)) return;

    viewedBanners.current.add(activeBanner.id);
    trackBannerEvent(activeBanner.id, 'view');
  }, [activeBanner]);

  useEffect(() => {
    if (bannerCount < 2 || isPaused) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % bannerCount);
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [bannerCount, isPaused]);

  if (!activeBanner) return null;

  const showPrevious = () => {
    setActiveIndex(current => (current - 1 + bannerCount) % bannerCount);
  };

  const showNext = () => {
    setActiveIndex(current => (current + 1) % bannerCount);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null || bannerCount < 2) return;

    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    if (distance > 0) showPrevious();
    else showNext();
  };

  const handleBannerClick = () => {
    trackBannerEvent(activeBanner.id, 'click');
  };

  const bannerImage = failedImages.has(activeBanner.id) ? null : activeBanner.image_url;
  const href = getBannerHref(activeBanner);
  const bannerTitle = activeBanner.title || 'View promotion';
  const bannerAriaLabel = activeBanner.description
    ? `${bannerTitle}: ${activeBanner.description}`
    : bannerTitle;
  const slideContent = bannerImage ? (
    <img
      key={activeBanner.id}
      src={bannerImage}
      alt={activeBanner.title || 'Marketplace promotion'}
      className="h-full w-full animate-fade-in object-cover object-top"
      onError={() => {
        setFailedImages(current => new Set(current).add(activeBanner.id));
      }}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="px-12 text-center">
        <ImageOff className="mx-auto h-8 w-8 text-white/70" />
        <p className="mt-3 text-lg font-bold sm:text-2xl">{activeBanner.title}</p>
        {activeBanner.description && <p className="mt-1 text-sm text-blue-100">{activeBanner.description}</p>}
      </div>
    </div>
  );

  return (
    <section
      aria-label="Marketplace offers"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={event => { touchStartX.current = event.touches[0].clientX; }}
      onTouchEnd={handleTouchEnd}
      className="relative -mx-4 -mt-4 mb-7 overflow-hidden bg-slate-100 dark:bg-slate-800 lg:-mx-8 lg:-mt-8"
    >
      <div className="relative aspect-[3/1] w-full">
        {href ? (
          <a
            href={href}
            target={activeBanner.target === '_blank' ? '_blank' : '_self'}
            rel={activeBanner.target === '_blank' ? 'noopener noreferrer' : undefined}
            onClick={handleBannerClick}
            aria-label={bannerAriaLabel}
            className="block h-full w-full"
          >
            {slideContent}
          </a>
        ) : (
          <div className="h-full w-full">{slideContent}</div>
        )}

        {bannerCount > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Previous banner"
              title="Previous banner"
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-transparent text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.85)] transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-3"
            >
              <ChevronLeft className="h-8 w-8" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Next banner"
              title="Next banner"
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-transparent text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.85)] transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-3"
            >
              <ChevronRight className="h-8 w-8" strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      {bannerCount > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 border border-white/50 bg-slate-950/55 p-1.5">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show banner ${index + 1}: ${banner.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`h-1.5 transition-[width,background-color] ${
                index === activeIndex ? 'w-7 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        Banner {activeIndex + 1} of {bannerCount}: {activeBanner.title}
      </p>
    </section>
  );
}