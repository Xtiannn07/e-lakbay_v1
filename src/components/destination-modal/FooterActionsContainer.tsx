import React from 'react';

interface FooterActionsContainerProps {
  onRate?: () => void;
  hasLocation: boolean;
  onViewRoutes: () => void;
  detailsOpen: boolean;
  onCloseDetails: () => void;
}

export const FooterActionsContainer: React.FC<FooterActionsContainerProps> = ({
  onRate,
  hasLocation,
  onViewRoutes,
  detailsOpen,
  onCloseDetails,
}) => (
  <div className="pt-2 border-t border-white/10">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      {onRate ? (
        <button
          type="button"
          onClick={onRate}
          className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-white/20 transition-colors"
        >
          Rate
        </button>
      ) : (
        <span className="text-[10px] sm:text-xs text-white/40">Average rating shown</span>
      )}
      <button
        type="button"
        onClick={onViewRoutes}
        className="text-xs sm:text-sm font-semibold text-white/80 underline underline-offset-4 hover:text-white disabled:opacity-60"
        disabled={!hasLocation}
      >
        View Routes
      </button>
    </div>

    {detailsOpen && (
      <button
        type="button"
        onClick={onCloseDetails}
        className="mt-2 text-[10px] sm:text-xs text-white/60 underline underline-offset-4 hover:text-white lg:hidden"
      >
        See less
      </button>
    )}
  </div>
);
