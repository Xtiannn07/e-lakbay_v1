import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Avatar } from './Avatar';
import { DestinationModalCard } from './DestinationModalCard';
import type { LocationData } from '../lib/locationTypes';

interface DestinationCardProps {
  title: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  postedBy?: string;
  postedByImageUrl?: string | null;
  postedById?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  location?: LocationData;
  showDescription?: boolean;
  showMeta?: boolean;
  imageClassName?: string;
  className?: string;
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

export const DestinationCard: React.FC<DestinationCardProps> = ({
  title,
  description,
  imageUrl,
  imageUrls,
  postedBy,
  postedByImageUrl,
  postedById,
  ratingAvg,
  ratingCount,
  location,
  showDescription = false,
  showMeta = true,
  imageClassName,
  className,
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

  const handleCardClick = () => {
    if (enableModal) {
      setIsModalOpen(true);
      return;
    }
    onClick?.();
  };

  const shouldShowMeta = Boolean(postedBy) && showMeta;
  const shouldShowDescription = showDescription && Boolean(description);
  const cardClassName = `rounded-bl-xl rounded-tr-xl border border-white/10 bg-white/5 ${className ?? ''}`;
  const cardImageClassName = `relative overflow-hidden rounded-bl-xl rounded-tr-xl ${imageClassName ?? 'aspect-[4/3]'}`;

  const content = (
    <div className="flex flex-col h-full">
      <div className={cardImageClassName}>
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          <Star className="h-3.5 w-3.5 text-yellow-300" fill="currentColor" />
          <span>{formatRating(ratingAvg, ratingCount)}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center gap-2">
            <Avatar
              name={postedBy ?? 'Traveler'}
              imageUrl={postedByImageUrl}
              sizeClassName="h-7 w-7"
              className="bg-black/40"
              asButton={false}
              onClick={
                postedById && onProfileClick
                  ? (event) => {
                      event.stopPropagation();
                      onProfileClick(postedById);
                    }
                  : undefined
              }
            />
            <p className="text-sm sm:text-base font-semibold text-white">{title}</p>
          </div>
        </div>
      </div>
      {(shouldShowMeta || shouldShowDescription) && (
        <div className="px-4 pb-4 pt-3">
          {shouldShowMeta && <p className="text-xs text-white/60">{postedBy}</p>}
          {shouldShowDescription && (
            <p className="mt-2 text-sm text-white/70 leading-relaxed line-clamp-3">{description}</p>
          )}
        </div>
      )}
    </div>
  );

  if (enableModal || onClick) {
    const wrapperClassName = `text-left focus:outline-none focus:ring-2 focus:ring-white/30 ${cardClassName}`;
    return (
      <>
        <button type="button" onClick={handleCardClick} className={wrapperClassName}>
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
                postedBy={postedBy}
                postedByImageUrl={postedByImageUrl}
                postedById={postedById}
                ratingAvg={ratingAvg}
                ratingCount={ratingCount}
                onRate={onRate}
                onProfileClick={onProfileClick}
                location={location}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return <div className={cardClassName}>{content}</div>;
};
