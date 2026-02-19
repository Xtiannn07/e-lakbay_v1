import React from 'react';
import { Star } from 'lucide-react';

interface DescriptionContainerProps {
  detailsOpen: boolean;
  title: string;
  ratingLabel: string;
  description: string;
}

export const DescriptionContainer: React.FC<DescriptionContainerProps> = ({
  detailsOpen,
  title,
  ratingLabel,
  description,
}) => (
  <div className={`flex flex-col gap-2 ${detailsOpen ? 'block' : 'hidden'} lg:block`}>
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
      <div className="flex items-center gap-2 text-xs sm:text-sm text-yellow-300">
        <Star className="h-4 w-4 text-yellow-300" fill="currentColor" />
        <span className="text-white/70">{ratingLabel}</span>
      </div>
    </div>

    <div className="max-h-28 sm:max-h-36 pr-1 overflow-y-auto hide-scrollbar">
      <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{description}</p>
    </div>
  </div>
);
