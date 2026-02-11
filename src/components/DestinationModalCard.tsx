import React, { useMemo, useState } from 'react';

interface DestinationModalCardProps {
  title: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  meta?: string;
  postedBy?: string;
  postedByImageUrl?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
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

export const DestinationModalCard: React.FC<DestinationModalCardProps> = ({
  title,
  description,
  imageUrl,
  imageUrls,
  meta,
  postedBy = 'Tourism Office',
  postedByImageUrl,
  ratingAvg,
  ratingCount,
  onRate,
}) => {
  const images = useMemo(() => {
    if (imageUrls && imageUrls.length > 0) {
      return imageUrls;
    }
    return [imageUrl];
  }, [imageUrl, imageUrls]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  );

  const forecastDays = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() + index + 1);
      return {
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
        temp: `${28 + (index % 3)}°C`,
        condition: index % 2 === 0 ? 'Clouds' : 'Sunny',
        icon: index % 2 === 0 ? '☁️' : '☀️',
      };
    });
  }, []);

  return (
    <article className="glass-secondary border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col gap-5 w-full max-h-[85vh] overflow-y-auto lg:max-h-none lg:overflow-visible">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
          <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[10px] sm:text-xs font-semibold overflow-hidden">
            {postedByImageUrl ? (
              <img src={postedByImageUrl} alt={postedBy} className="h-full w-full object-cover" />
            ) : (
              postedBy.charAt(0).toUpperCase()
            )}
          </span>
          <span>{postedBy}</span>
        </div>
        {meta && <span className="text-[10px] sm:text-xs text-white/50">{meta}</span>}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-5">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/10">
          <img
            src={images[activeIndex]}
            alt={title}
            className="h-56 sm:h-72 lg:h-80 w-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/30 text-white flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Previous image"
              >
                <span className="text-lg">‹</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/30 text-white flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Next image"
              >
                <span className="text-lg">›</span>
              </button>
            </>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1">
              {images.map((_, index) => (
                <span
                  key={`dot-${index}`}
                  className={`h-2 w-2 rounded-full ${index === activeIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="glass border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <span>📍</span>
              <span>{title}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-white/60">{todayLabel}</span>
          </div>

          <div className={`${detailsOpen ? 'block' : 'hidden'} lg:block`}>
            <>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-7xl">☁️</div>
                <div>
                  <div className="text-xl sm:text-4xl font-bold">29°C</div>
                  <div className="text-xs sm:text-sm text-white/60">Clouds</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-white/70">
                <div className="flex items-center gap-1">
                  <span className="text-lg sm:text-2xl">💧</span>
                  <span>Humidity 78%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg sm:text-2xl">💨</span>
                  <span>Wind 12 km/h</span>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/50 mb-2">Forecast</p>
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  {forecastDays.map((day, index) => (
                    <div
                      key={`${day.label}-${index}`}
                      className="min-w-[120px] rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-1"
                    >
                      <span className="text-[10px] sm:text-xs text-white/60">{day.label}</span>
                      <span className="text-base sm:text-lg">{day.icon}</span>
                      <span className="text-xs sm:text-sm font-semibold">{day.temp}</span>
                      <span className="text-[10px] sm:text-xs text-white/50">{day.condition}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          </div>
        </div>
      </div>

      {!detailsOpen && (
        <div className="flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2 text-xs text-yellow-300">
            <span>★</span>
            <span className="text-white/70">{formatRating(ratingAvg, ratingCount)}</span>
          </div>
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="text-xs font-semibold text-white/80 underline underline-offset-4 hover:text-white"
          >
            See more
          </button>
        </div>
      )}

      <div className={`flex flex-col gap-2 ${detailsOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-yellow-300">
            <span>★</span>
            <span className="text-white/70">{formatRating(ratingAvg, ratingCount)}</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{description}</p>
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
            className="text-xs sm:text-sm font-semibold text-white/80 underline underline-offset-4 hover:text-white"
          >
            View Routes
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDetailsOpen(false)}
          className="text-[10px] sm:text-xs text-white/60 underline underline-offset-4 hover:text-white lg:hidden"
        >
          See less
        </button>
      </div>
    </article>
  );
};
