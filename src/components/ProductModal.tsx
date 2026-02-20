import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { Avatar } from './Avatar';
import ViewRoutesModal from './ViewRoutesModal';
import type { LocationData } from '../lib/locationTypes';
import { preloadImageUrl } from '../lib/imagePreloadCache';

const preloadedProductGalleryKeys = new Set<string>();

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    imageUrls?: string[];
    description?: string | null;
    ratingAvg?: number;
    ratingCount?: number;
    uploaderName?: string;
    uploaderImageUrl?: string | null;
    uploaderId?: string | null;
    location?: LocationData;
  } | null;
  onRate?: () => void;
  onProfileClick?: (profileId: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  open,
  onClose,
  product,
  onRate,
  onProfileClick,
}) => {
  if (!open || !product) return null;
  const [showRoutes, setShowRoutes] = useState(false);
  const hasLocation = Boolean(product.location && typeof product.location.lat === 'number' && typeof product.location.lng === 'number');

  const images = useMemo(() => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls;
    }
    return [product.imageUrl];
  }, [product.imageUrl, product.imageUrls]);
  const galleryKey = useMemo(() => images.join('|'), [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [slideState, setSlideState] = useState<{
    from: number;
    to: number;
    direction: 'next' | 'prev';
  } | null>(null);
  const [offsetPercent, setOffsetPercent] = useState(0);
  const [transitionMs, setTransitionMs] = useState(320);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isGalleryReady, setIsGalleryReady] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    setSlideState(null);
    setOffsetPercent(0);
    setIsTransitioning(false);
    setIsImageLoading(false);
    setIsGalleryReady(false);
    setShowRoutes(false);
  }, [open, product.id]);

  const formatRating = (ratingAvg?: number, ratingCount?: number) => {
    if (!ratingAvg || Number.isNaN(ratingAvg)) {
      return 'No ratings yet';
    }
    if (ratingCount && ratingCount > 0) {
      return `${ratingAvg.toFixed(1)} (${ratingCount})`;
    }
    return ratingAvg.toFixed(1);
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    if (preloadedProductGalleryKeys.has(galleryKey)) {
      setIsGalleryReady(true);
      setIsImageLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const preloadAll = async () => {
      setIsGalleryReady(false);
      setIsImageLoading(true);
      await Promise.all(images.map((src) => preloadImageUrl(src)));

      if (cancelled) return;
      preloadedProductGalleryKeys.add(galleryKey);
      setIsGalleryReady(true);
      setIsImageLoading(false);
    };

    void preloadAll();

    return () => {
      cancelled = true;
    };
  }, [galleryKey, images, open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    setSlideState(null);
    setOffsetPercent(0);
    setIsTransitioning(false);
  }, [galleryKey, open]);

  useEffect(() => {
    if (!open || images.length === 0) return;

    const current = images[activeIndex];
    const next = images[(activeIndex + 1) % images.length];
    const prev = images[(activeIndex - 1 + images.length) % images.length];

    void preloadImageUrl(current);
    void preloadImageUrl(next);
    void preloadImageUrl(prev);
  }, [activeIndex, images, open]);

  const runSlide = async (direction: 'next' | 'prev') => {
    if (isTransitioning || images.length <= 1 || !isGalleryReady) return;

    const targetIndex =
      direction === 'next'
        ? (activeIndex + 1) % images.length
        : (activeIndex - 1 + images.length) % images.length;

    const duration = 320;

    const startOffset = direction === 'next' ? 0 : 50;
    const endOffset = direction === 'next' ? 50 : 0;

    setTransitionMs(duration);
    setSlideState({
      from: direction === 'next' ? activeIndex : targetIndex,
      to: direction === 'next' ? targetIndex : activeIndex,
      direction,
    });
    setOffsetPercent(startOffset);
    setIsTransitioning(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTransitioning(true);
        setOffsetPercent(endOffset);
      });
    });
  };

  const handlePrev = () => {
    runSlide('prev');
  };

  const handleNext = () => {
    runSlide('next');
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || images.length <= 1 || isTransitioning || isImageLoading || !isGalleryReady) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const elapsed = performance.now() - start.time;

    if (elapsed > 800) return;
    if (Math.abs(deltaX) < 50) return;
    if (Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    if (deltaX > 0) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="max-w-5xl w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <article className="glass-secondary modal-stone-text border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-5">
            <div
              className="relative rounded-2xl overflow-hidden glass-card"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                swipeStartRef.current = null;
              }}
            >
              <img
                src={images[activeIndex]}
                alt={product.name}
                className="h-64 sm:h-80 md:h-[520px] w-full object-cover"
                loading="eager"
                decoding="sync"
              />

              {slideState && (
                <div
                  className="absolute inset-0 flex w-[200%]"
                  style={{
                    transform: `translateX(-${offsetPercent}%)`,
                    transition: isTransitioning ? `transform ${transitionMs}ms ease` : 'none',
                  }}
                  onTransitionEnd={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (!slideState) return;
                    setActiveIndex(slideState.direction === 'next' ? slideState.to : slideState.from);
                    setSlideState(null);
                    setIsTransitioning(false);
                    setIsImageLoading(false);
                    setOffsetPercent(0);
                  }}
                >
                  <div className="w-1/2">
                    <img
                      src={images[slideState.from]}
                      alt={product.name}
                      className="h-64 sm:h-80 md:h-[520px] w-full object-cover"
                      loading="eager"
                      decoding="sync"
                    />
                  </div>
                  <div className="w-1/2">
                    <img
                      src={images[slideState.to]}
                      alt={product.name}
                      className="h-64 sm:h-80 md:h-[520px] w-full object-cover"
                      loading="eager"
                      decoding="sync"
                    />
                  </div>
                </div>
              )}

              {isImageLoading && (
                <div className="absolute inset-0 bg-black/25 pointer-events-none" />
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={handlePrev}
                    disabled={isImageLoading || isTransitioning}
                    className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={handleNext}
                    disabled={isImageLoading || isTransitioning}
                    className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize disabled:cursor-not-allowed"
                  />
                </>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1">
                  {images.map((_, index) => (
                    <span
                      key={`dot-${index}`}
                      className={`h-2 w-2 rounded-full ${index === activeIndex ? 'bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold" id="product-modal-title">
                    {product.name}
                  </h2>
                  {product.uploaderName && (
                    <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm modal-stone-muted">
                      <Avatar
                        name={product.uploaderName}
                        imageUrl={product.uploaderImageUrl}
                        sizeClassName="h-7 w-7"
                        onClick={
                          product.uploaderId && onProfileClick
                            ? () => onProfileClick(product.uploaderId as string)
                            : undefined
                        }
                      />
                      {product.uploaderId && onProfileClick ? (
                        <button
                          type="button"
                          onClick={() => onProfileClick(product.uploaderId as string)}
                          className="hover:underline hover:underline-offset-4"
                        >
                          {product.uploaderName}
                        </button>
                      ) : (
                        <span>{product.uploaderName}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-yellow-300">
                  <Star className="h-4 w-4" fill="currentColor" />
                  <span className="modal-stone-muted">{formatRating(product.ratingAvg, product.ratingCount)}</span>
                </div>
              </div>

              <div className="max-h-40 md:max-h-96 overflow-y-auto pr-1">
                <p className="text-sm sm:text-base modal-stone-muted leading-relaxed">
                  {product.description || 'A locally crafted product from Ilocos Sur.'}
                </p>
              </div>

              {(onRate || hasLocation) && (
                <div className="mt-auto flex flex-wrap justify-end gap-2">
                  {hasLocation && (
                    <button
                      type="button"
                      onClick={() => setShowRoutes(true)}
                      className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
                    >
                      View Routes
                    </button>
                  )}
                  {onRate && (
                    <button
                      type="button"
                      onClick={onRate}
                      className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
                    >
                      Rate
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
      {showRoutes && product.location && (
        <ViewRoutesModal destination={product.location} onClose={() => setShowRoutes(false)} />
      )}
    </div>
  );
};
