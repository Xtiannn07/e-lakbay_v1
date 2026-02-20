import React from 'react';

interface SlideState {
  from: number;
  to: number;
  direction: 'next' | 'prev';
}

interface ImageGalleryContainerProps {
  images: string[];
  title: string;
  activeIndex: number;
  slideState: SlideState | null;
  offsetPercent: number;
  transitionMs: number;
  isTransitioning: boolean;
  isImageLoading: boolean;
  isGalleryReady: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: () => void;
  onTransitionEnd: (event: React.TransitionEvent<HTMLDivElement>) => void;
}

export const ImageGalleryContainer: React.FC<ImageGalleryContainerProps> = ({
  images,
  title,
  activeIndex,
  slideState,
  offsetPercent,
  transitionMs,
  isTransitioning,
  isImageLoading,
  isGalleryReady,
  onPrev,
  onNext,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onTransitionEnd,
}) => (
  <div
    className="relative rounded-2xl overflow-hidden glass-image-card"
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerCancel}
  >
    <img
      src={images[activeIndex]}
      alt={title}
      className="w-full object-cover aspect-video"
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
        onTransitionEnd={onTransitionEnd}
      >
        <div className="w-1/2">
          <img
            src={images[slideState.from]}
            alt={title}
            className="w-full object-cover aspect-video"
            loading="eager"
            decoding="sync"
          />
        </div>
        <div className="w-1/2">
          <img
            src={images[slideState.to]}
            alt={title}
            className="w-full object-cover aspect-video"
            loading="eager"
            decoding="sync"
          />
        </div>
      </div>
    )}

    {isImageLoading && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}

    {images.length > 1 && (
      <>
        <button
          type="button"
          aria-label="Previous image"
          onClick={onPrev}
          disabled={isImageLoading || isTransitioning || !isGalleryReady}
          className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize disabled:cursor-not-allowed"
        />
        <button
          type="button"
          aria-label="Next image"
          onClick={onNext}
          disabled={isImageLoading || isTransitioning || !isGalleryReady}
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
);
