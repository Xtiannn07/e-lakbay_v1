import React, { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { Avatar } from './Avatar';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    name: string;
    imageUrl: string;
    imageUrls?: string[];
    description?: string | null;
    ratingAvg?: number;
    ratingCount?: number;
    uploaderName?: string;
    uploaderImageUrl?: string | null;
    uploaderId?: string | null;
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

  const images = useMemo(() => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls;
    }
    return [product.imageUrl];
  }, [product.imageUrl, product.imageUrls]);

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

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    setSlideState(null);
    setOffsetPercent(0);
    setIsTransitioning(false);
    setIsImageLoading(false);
  }, [open, product.id]);

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => onClose();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [open, onClose]);

  const formatRating = (ratingAvg?: number, ratingCount?: number) => {
    if (!ratingAvg || Number.isNaN(ratingAvg)) {
      return 'No ratings yet';
    }
    if (ratingCount && ratingCount > 0) {
      return `${ratingAvg.toFixed(1)} (${ratingCount})`;
    }
    return ratingAvg.toFixed(1);
  };

  const preloadImage = (src: string) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    });

  const runSlide = async (direction: 'next' | 'prev') => {
    if (isTransitioning || images.length <= 1) return;

    const targetIndex =
      direction === 'next'
        ? (activeIndex + 1) % images.length
        : (activeIndex - 1 + images.length) % images.length;

    setIsImageLoading(true);
    const start = performance.now();
    await preloadImage(images[targetIndex]);
    const elapsed = performance.now() - start;
    const duration = Math.min(900, Math.max(220, Math.round(elapsed)));

    setTransitionMs(duration);
    setSlideState({
      from: direction === 'next' ? activeIndex : targetIndex,
      to: direction === 'next' ? targetIndex : activeIndex,
      direction,
    });
    setOffsetPercent(direction === 'next' ? 0 : 50);
    setIsTransitioning(false);

    requestAnimationFrame(() => {
      setIsTransitioning(true);
      setOffsetPercent(direction === 'next' ? 50 : 0);
    });
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
        <article className="glass-secondary border border-white/10 rounded-2xl p-4 sm:p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/10">
              {slideState ? (
                <div
                  className="flex w-[200%]"
                  style={{
                    transform: `translateX(-${offsetPercent}%)`,
                    transition: isTransitioning ? `transform ${transitionMs}ms ease` : 'none',
                  }}
                  onTransitionEnd={() => {
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
                    />
                  </div>
                  <div className="w-1/2">
                    <img
                      src={images[slideState.to]}
                      alt={product.name}
                      className="h-64 sm:h-80 md:h-[520px] w-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <img
                  src={images[activeIndex]}
                  alt={product.name}
                  className="h-64 sm:h-80 md:h-[520px] w-full object-cover"
                />
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => runSlide('prev')}
                    disabled={isImageLoading || isTransitioning}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/30 text-white flex items-center justify-center hover:bg-black/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous image"
                  >
                    <span className="text-lg">‹</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runSlide('next')}
                    disabled={isImageLoading || isTransitioning}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/30 text-white flex items-center justify-center hover:bg-black/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next image"
                  >
                    <span className="text-lg">›</span>
                  </button>
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
                    <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-white/60">
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
                  <span className="text-white/80">{formatRating(product.ratingAvg, product.ratingCount)}</span>
                </div>
              </div>

              <div className="max-h-40 md:max-h-96 overflow-y-auto pr-1">
                <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                  {product.description || 'A locally crafted product from Ilocos Sur.'}
                </p>
              </div>

              {onRate && (
                <div className="mt-auto flex justify-end">
                  <button
                    type="button"
                    onClick={onRate}
                    className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    Rate
                  </button>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
