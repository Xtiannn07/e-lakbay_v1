import React from 'react';

interface ShowcaseCardProps {
  title: string;
  description: string;
  imageUrl: string;
  meta?: string;
  onRate: () => void;
}

export const ShowcaseCard: React.FC<ShowcaseCardProps> = ({
  title,
  description,
  imageUrl,
  meta,
  onRate,
}) => {
  return (
    <article className="glass-secondary border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
      <div className="h-40 w-full sm:h-36 sm:w-36 rounded-xl overflow-hidden border border-white/10 bg-white/10 shrink-0">
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="flex-1 flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {meta && <p className="text-xs text-white/60 mt-1">{meta}</p>}
        </div>
        <p className="text-sm text-white/70 leading-relaxed">{description}</p>
        <div className="mt-auto flex justify-end">
          <button
            type="button"
            onClick={onRate}
            className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Rate
          </button>
        </div>
      </div>
    </article>
  );
};
