import React from 'react';

interface DashboardSidebarProps {
  displayName: string;
  battleCry: string;
  imgUrl?: string | null;
  onOpenProductUpload: () => void;
  onOpenDestinationUpload: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  displayName,
  battleCry,
  imgUrl,
  onOpenProductUpload,
  onOpenDestinationUpload,
}) => {
  return (
    <aside className="lg:w-72 w-full">
      <div className="glass-secondary border border-white/10 rounded-2xl p-5 sticky top-24">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-28 w-28 rounded-full border border-white/20 bg-white/10 overflow-hidden flex items-center justify-center">
            {imgUrl ? (
              <img src={imgUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-white/80">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-white/60 mt-1">{battleCry}</p>
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-white/60 mt-6">Dashboard</p>
        <nav className="mt-4 flex flex-col gap-2 text-sm">
          <a href="#analytics-overview" className="text-white/80 hover:text-white transition-colors">
            Overview
          </a>
          <a href="#key-metrics" className="text-white/80 hover:text-white transition-colors">
            Key Metrics
          </a>
          <a href="#visitor-trends" className="text-white/80 hover:text-white transition-colors">
            Visitor Trends
          </a>
          <a href="#top-destinations" className="text-white/80 hover:text-white transition-colors">
            Top Destinations
          </a>
          <a href="#products" className="text-white/80 hover:text-white transition-colors">
            Products
          </a>
          <a href="#destinations" className="text-white/80 hover:text-white transition-colors">
            Destinations
          </a>
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4 flex flex-col gap-3">
          <button
            type="button"
            className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
            onClick={onOpenProductUpload}
          >
            Upload Product
          </button>
          <button
            type="button"
            className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
            onClick={onOpenDestinationUpload}
          >
            Upload Destination
          </button>
        </div>
      </div>
    </aside>
  );
};
