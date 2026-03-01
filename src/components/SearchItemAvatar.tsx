import React from 'react';
import { cn } from '../lib/utils';

export type SearchItemType = 'destination' | 'product';

export interface SearchItemAvatarProps {
  id: string;
  name: string;
  imageUrl: string | null;
  type: SearchItemType;
  meta?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Universal avatar component for both destinations and products.
 * Displays a square image with a clickable name.
 */
export const SearchItemAvatar: React.FC<SearchItemAvatarProps> = ({
  name,
  imageUrl,
  type,
  meta,
  onClick,
  className,
}) => {
  const fallbackImage = type === 'destination'
    ? '/placeholder-destination.jpg'
    : '/placeholder-product.jpg';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group',
        className
      )}
    >
      {/* Square image */}
      <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-white/10">
        <img
          src={imageUrl || fallbackImage}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = fallbackImage;
          }}
        />
      </div>

      {/* Name and meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-white/90">
          {name}
        </p>
        {meta && (
          <p className="text-xs text-white/60 truncate">
            {meta}
          </p>
        )}
      </div>

      {/* Type badge */}
      <span className={cn(
        'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
        type === 'destination'
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-blue-500/20 text-blue-400'
      )}>
        {type}
      </span>
    </button>
  );
};
