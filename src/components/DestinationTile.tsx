import React from 'react';

interface DestinationTileProps {
  title: string;
  description: string;
  imageUrl: string;
  ratingAvg?: number;
  ratingCount?: number;
  onClick?: () => void;
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

export const DestinationTile: React.FC<DestinationTileProps> = ({
  title,
  description,
  imageUrl,
  ratingAvg,
  ratingCount,
  onClick,
}) => {
  const content = (
    <article className="glass-secondary border border-white/10 rounded-2xl p-4 flex flex-col h-full">
      <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-white/10">
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white/90">{title}</h3>
          <div className="flex items-center gap-1 text-xs text-yellow-300">
            <span>★</span>
            <span className="text-white/70">{formatRating(ratingAvg, ratingCount)}</span>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed line-clamp-3">{description}</p>
      </div>
    </article>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-left focus:outline-none focus:ring-2 focus:ring-white/30 rounded-2xl"
      >
        {content}
      </button>
    );
  }

  return content;
};
