import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Avatar } from './Avatar';
import ViewRoutesModal from './ViewRoutesModal';
import type { LocationData } from '../lib/locationTypes';

interface ProductCardProps {
  title: string;
  description?: string;
  imageUrl: string;
  meta?: string;
  ratingAvg?: number;
  ratingCount?: number;
  uploaderName?: string;
  uploaderImageUrl?: string | null;
  uploaderId?: string | null;
  location?: LocationData;
  onProfileClick?: (profileId: string) => void;
  showDescription?: boolean;
  showMeta?: boolean;
  imageClassName?: string;
  className?: string;
  onClick?: () => void;
  onRate?: () => void;
}

const formatRating = (ratingAvg?: number, ratingCount?: number) => {
  if (!ratingAvg || Number.isNaN(ratingAvg)) {
    return 'No ratings yet';
  }
  if (ratingCount && ratingCount > 0) {
    return `${ratingAvg.toFixed(1)} (${ratingCount})`;
  }
  return ratingAvg.toFixed(1);
};

export const ProductCard: React.FC<ProductCardProps> = ({
  title,
  description,
  imageUrl,
  meta,
  ratingAvg,
  ratingCount,
  uploaderName,
  uploaderImageUrl,
  uploaderId,
  location,
  onProfileClick,
  showDescription = false,
  showMeta = true,
  imageClassName,
  className,
  onClick,
  onRate,
}) => {
  const [showRoutes, setShowRoutes] = useState(false);
  const hasLocation = Boolean(location && typeof location.lat === 'number' && typeof location.lng === 'number');
  const shouldShowMeta = Boolean(meta) && showMeta && !uploaderName;
  const shouldShowUploader = Boolean(uploaderName) && showMeta;
  const shouldShowDescription = showDescription && Boolean(description);
  const cardClassName = `rounded-bl-xl rounded-tr-xl glass-card-nonmodal ${className ?? ''}`;
  const cardImageClassName = `relative overflow-hidden rounded-bl-xl rounded-tr-xl ${imageClassName ?? 'aspect-square'}`;

  const content = (
    <div className="flex flex-col h-full text-white ">
      <div className={cardImageClassName}>
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
          <Star className="h-3.5 w-3.5 text-yellow-300" fill="currentColor" />
          <span>{formatRating(ratingAvg, ratingCount)}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-2">
            <p className="text-sm font-semibold text-white line-clamp-2">{title}</p>
        </div>
      </div>
      {(shouldShowUploader || shouldShowMeta || shouldShowDescription || onRate || hasLocation) && (
        <div className="px-3 pb-3 pt-2">
          {shouldShowUploader && (
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Avatar
                name={uploaderName as string}
                imageUrl={uploaderImageUrl ?? undefined}
                sizeClassName="h-6 w-6"
                onClick={
                  uploaderId && onProfileClick && !onClick
                    ? (event) => {
                        event.stopPropagation();
                        onProfileClick(uploaderId);
                      }
                    : undefined
                }
              />
              {uploaderId && onProfileClick ? (
                onClick ? (
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      onProfileClick(uploaderId);
                    }}
                    className="hover:underline hover:underline-offset-4 cursor-pointer"
                  >
                    {uploaderName}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onProfileClick(uploaderId);
                    }}
                    className="hover:underline hover:underline-offset-4"
                  >
                    {uploaderName}
                  </button>
                )
              ) : (
                <span>{uploaderName}</span>
              )}
            </div>
          )}
          {shouldShowMeta && <p className="text-xs text-white/80">{meta}</p>}
          {shouldShowDescription && (
            <p className="mt-2 text-sm text-white/90 leading-relaxed line-clamp-2">{description}</p>
          )}
          {(onRate || hasLocation) && (
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {hasLocation && (
                onClick ? (
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowRoutes(true);
                    }}
                    className="rounded-full glass-button px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    View Routes
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowRoutes(true);
                    }}
                    className="rounded-full glass-button px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    View Routes
                  </button>
                )
              )}
              {onRate && (
                onClick ? (
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      onRate();
                    }}
                    className="rounded-full glass-button px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Rate
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRate();
                    }}
                    className="rounded-full glass-button px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Rate
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (onClick) {
    const wrapperClassName = `text-left focus:outline-none focus:ring-2 focus:ring-white/30 ${cardClassName}`;
    return (
      <>
        <button type="button" onClick={onClick} className={wrapperClassName}>
          {content}
        </button>
        {showRoutes && location && (
          <ViewRoutesModal destination={location} onClose={() => setShowRoutes(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className={cardClassName}>{content}</div>
      {showRoutes && location && (
        <ViewRoutesModal destination={location} onClose={() => setShowRoutes(false)} />
      )}
    </>
  );
};
