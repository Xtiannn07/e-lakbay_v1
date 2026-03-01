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
  <div className="relative z-40 pt-2 border-t border-white/10 modal-stone-text">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      {onRate ? (
        <button
          type="button"
          onClick={onRate}
          className="rounded-full glass-button px-4 py-2 text-xs sm:text-sm font-semibold transition-colors"
        >
          Rate
        </button>
      ) : (
        <span className="text-[10px] sm:text-xs modal-stone-soft">...</span>
      )}
      <button
        type="button"
        onClick={onViewRoutes}
        className="text-xs sm:text-sm font-semibold modal-stone-muted underline underline-offset-4 hover:opacity-80 disabled:opacity-60"
        disabled={!hasLocation}
      >
        View Routes
      </button>
    </div>

    {detailsOpen && (
      <button
        type="button"
        onClick={onCloseDetails}
        className="mt-2 text-[10px] sm:text-xs modal-stone-muted underline underline-offset-4 hover:opacity-80 lg:hidden"
      >
        See less
      </button>
    )}
  </div>
);
