import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { DestinationModalCard } from './DestinationModalCard';

interface DestinationTileProps {
  title: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  meta?: string;
  postedBy?: string;
  postedByImageUrl?: string | null;
  postedById?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  enableModal?: boolean;
  onRate?: () => void;
  onClick?: () => void;
  onProfileClick?: (profileId: string) => void;
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
  imageUrls,
  meta,
  postedBy,
  postedByImageUrl,
  postedById,
  ratingAvg,
  ratingCount,
  enableModal = false,
  onRate,
  onClick,
  onProfileClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleScroll = () => setIsModalOpen(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isModalOpen]);

  const handleTileClick = () => {
    if (enableModal) {
      setIsModalOpen(true);
      return;
    }
    onClick?.();
  };

  const content = (
    <article className="glass-secondary border border-white/10 rounded-2xl p-4 flex flex-col h-full">
      <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-white/10">
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white/90">{title}</h3>
          <div className="flex items-center gap-1 text-xs text-yellow-300">
            <Star className="h-3.5 w-3.5 text-yellow-300" fill="currentColor" />
            <span className="text-white/70">{formatRating(ratingAvg, ratingCount)}</span>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed line-clamp-3">{description}</p>
      </div>
    </article>
  );

  if (enableModal || onClick) {
    return (
      <>
        <button
          type="button"
          onClick={handleTileClick}
          className="text-left focus:outline-none focus:ring-2 focus:ring-white/30 rounded-2xl"
        >
          {content}
        </button>
        {enableModal && isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            role="presentation"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="max-w-5xl w-full max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar"
              role="dialog"
              aria-modal="true"
              aria-labelledby="destinations-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <DestinationModalCard
                title={title}
                description={description}
                imageUrl={imageUrl}
                imageUrls={imageUrls}
                meta={meta}
                postedBy={postedBy}
                postedByImageUrl={postedByImageUrl}
                postedById={postedById}
                ratingAvg={ratingAvg}
                ratingCount={ratingCount}
                onRate={onRate}
                onProfileClick={onProfileClick}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return content;
};
