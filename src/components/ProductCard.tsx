import React from 'react';
import { Star } from 'lucide-react';
import { Avatar } from './Avatar';

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
  onProfileClick,
  showDescription = false,
  showMeta = true,
  imageClassName,
  className,
  onClick,
  onRate,
}) => {
  const shouldShowMeta = Boolean(meta) && showMeta;
  const shouldShowDescription = showDescription && Boolean(description);
  const cardClassName = `rounded-bl-xl rounded-tr-xl border border-white/10 bg-white/5 ${className ?? ''}`;
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
      {(shouldShowMeta || shouldShowDescription || onRate) && (
        <div className="px-3 pb-3 pt-2">
          {shouldShowMeta && <p className="text-xs text-white/60">{meta}</p>}
          {shouldShowDescription && (
            <p className="mt-2 text-sm text-white/70 leading-relaxed line-clamp-2">{description}</p>
          )}
          {onRate && (
            <div className="mt-3 flex justify-end">
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
      )}
    </div>
  );

  if (onClick) {
    const wrapperClassName = `text-left focus:outline-none focus:ring-2 focus:ring-white/30 ${cardClassName}`;
    return (
      <button type="button" onClick={onClick} className={wrapperClassName}>
        {content}
      </button>
    );
  }

  return <div className={cardClassName}>{content}</div>;
};
