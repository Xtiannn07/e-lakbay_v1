import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  Snowflake,
  Star,
  Sun,
  Wind,
} from 'lucide-react';
import { Avatar } from './Avatar';
import ViewRoutesModal from './ViewRoutesModal';
import { DescriptionContainer } from './destination-modal/DescriptionContainer';
import { FooterActionsContainer } from './destination-modal/FooterActionsContainer';
import { ImageGalleryContainer } from './destination-modal/ImageGalleryContainer';
import { WeatherContainer } from './destination-modal/WeatherContainer';
import type { LocationData } from '../lib/locationTypes';
import { preloadImageUrl } from '../lib/imagePreloadCache';
import {
  fetchCurrentWeather,
  fetchCurrentWeatherByMunicipality,
  type CurrentWeatherData,
} from '../lib/weather';

const preloadedDestinationGalleryKeys = new Set<string>();

interface DestinationModalCardProps {
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
  onRate?: () => void;
  onProfileClick?: (profileId: string) => void;
  location?: LocationData;
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

const getWeatherIcon = (condition?: string) => {
  const normalized = condition?.toLowerCase() ?? '';

  if (normalized.includes('thunder')) return CloudLightning;
  if (normalized.includes('drizzle')) return CloudDrizzle;
  if (normalized.includes('rain')) return CloudRain;
  if (normalized.includes('snow') || normalized.includes('sleet') || normalized.includes('hail')) return Snowflake;
  if (normalized.includes('clear') || normalized.includes('sun')) return Sun;
  if (
    normalized.includes('mist') ||
    normalized.includes('fog') ||
    normalized.includes('haze') ||
    normalized.includes('smoke') ||
    normalized.includes('dust')
  ) {
    return Wind;
  }

  return Cloud;
};

export const DestinationModalCard: React.FC<DestinationModalCardProps> = ({
  title,
  description,
  imageUrl,
  imageUrls,
  meta,
  postedBy = 'Tourism Office',
  postedByImageUrl,
  postedById,
  ratingAvg,
  ratingCount,
  onRate,
  onProfileClick,
  location,
}) => {
  const images = useMemo(() => {
    if (imageUrls && imageUrls.length > 0) {
      return imageUrls;
    }
    return [imageUrl];
  }, [imageUrl, imageUrls]);
  const galleryKey = useMemo(() => images.join('|'), [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [slideState, setSlideState] = useState<{
    from: number;
    to: number;
    direction: 'next' | 'prev';
  } | null>(null);
  const [offsetPercent, setOffsetPercent] = useState(0);
  const [transitionMs, setTransitionMs] = useState(320);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isGalleryReady, setIsGalleryReady] = useState(false);
  const [weather, setWeather] = useState<CurrentWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const municipalityName = location?.municipality?.trim() ?? '';
  const hasLocation = Boolean(location && typeof location.lat === 'number' && typeof location.lng === 'number');
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (!municipalityName && (!hasLocation || location?.lat == null || location?.lng == null)) {
      setWeather(null);
      setWeatherError('Location municipality is unavailable.');
      setWeatherLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);

      try {
        const result = municipalityName
          ? await fetchCurrentWeatherByMunicipality(municipalityName, 'Ilocos Sur', 'PH', controller.signal)
          : await fetchCurrentWeather(location?.lat as number, location?.lng as number, controller.signal);

        if (!controller.signal.aborted) {
          setWeather(result);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Unable to load weather right now.';
        setWeather(null);
        setWeatherError(message);
      } finally {
        if (!controller.signal.aborted) {
          setWeatherLoading(false);
        }
      }
    };

    void loadWeather();

    return () => {
      controller.abort();
    };
  }, [hasLocation, location?.lat, location?.lng, municipalityName]);

  useEffect(() => {
    let cancelled = false;

    if (preloadedDestinationGalleryKeys.has(galleryKey)) {
      setIsGalleryReady(true);
      setIsImageLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const preloadAll = async () => {
      setIsGalleryReady(false);
      setIsImageLoading(true);
      await Promise.all(images.map((src) => preloadImageUrl(src)));

      if (cancelled) return;
      preloadedDestinationGalleryKeys.add(galleryKey);
      setIsGalleryReady(true);
      setIsImageLoading(false);
    };

    void preloadAll();

    return () => {
      cancelled = true;
    };
  }, [galleryKey]);

  useEffect(() => {
    if (images.length === 0) return;

    const current = images[activeIndex];
    const next = images[(activeIndex + 1) % images.length];
    const prev = images[(activeIndex - 1 + images.length) % images.length];

    void preloadImageUrl(current);
    void preloadImageUrl(next);
    void preloadImageUrl(prev);
  }, [activeIndex, galleryKey]);

  useEffect(() => {
    setActiveIndex(0);
    setSlideState(null);
    setOffsetPercent(0);
    setIsTransitioning(false);
  }, [galleryKey]);

  const runSlide = async (direction: 'next' | 'prev') => {
    if (isTransitioning || images.length <= 1 || !isGalleryReady) return;

    const targetIndex =
      direction === 'next'
        ? (activeIndex + 1) % images.length
        : (activeIndex - 1 + images.length) % images.length;

    const duration = 320;
    const startOffset = direction === 'next' ? 0 : 50;
    const endOffset = direction === 'next' ? 50 : 0;

    setTransitionMs(duration);
    setSlideState({
      from: direction === 'next' ? activeIndex : targetIndex,
      to: direction === 'next' ? targetIndex : activeIndex,
      direction,
    });
    setOffsetPercent(startOffset);
    setIsTransitioning(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTransitioning(true);
        setOffsetPercent(endOffset);
      });
    });
  };

  const handlePrev = () => {
    void runSlide('prev');
  };

  const handleNext = () => {
    void runSlide('next');
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || images.length <= 1 || isTransitioning || isImageLoading || !isGalleryReady) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const elapsed = performance.now() - start.time;

    if (elapsed > 800) return;
    if (Math.abs(deltaX) < 50) return;
    if (Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    if (deltaX > 0) {
      handlePrev();
    } else {
      handleNext();
    }
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

  const WeatherIcon = getWeatherIcon(weather?.condition);

  const headerSection = (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
        <Avatar
          name={postedBy}
          imageUrl={postedByImageUrl}
          sizeClassName="h-6 w-6 sm:h-7 sm:w-7"
          onClick={postedById && onProfileClick ? () => onProfileClick(postedById) : undefined}
        />
        {postedById && onProfileClick ? (
          <button
            type="button"
            onClick={() => onProfileClick(postedById)}
            className="hover:underline hover:underline-offset-4"
          >
            {postedBy}
          </button>
        ) : (
          <span>{postedBy}</span>
        )}
      </div>
      {meta && <span className="text-[10px] sm:text-xs text-white/50">{meta}</span>}
    </header>
  );

  const mediaAndWeatherSection = (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] gap-5">
      <ImageGalleryContainer
        images={images}
        title={title}
        activeIndex={activeIndex}
        slideState={slideState}
        offsetPercent={offsetPercent}
        transitionMs={transitionMs}
        isTransitioning={isTransitioning}
        isImageLoading={isImageLoading}
        isGalleryReady={isGalleryReady}
        onPrev={handlePrev}
        onNext={handleNext}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeStartRef.current = null;
        }}
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return;
          if (!slideState) return;
          setActiveIndex(slideState.direction === 'next' ? slideState.to : slideState.from);
          setSlideState(null);
          setIsTransitioning(false);
          setIsImageLoading(false);
          setOffsetPercent(0);
        }}
      />

      <WeatherContainer
        detailsOpen={detailsOpen}
        title={title}
        todayLabel={todayLabel}
        weatherLoading={weatherLoading}
        weather={weather}
        WeatherIcon={WeatherIcon}
      />
    </div>
  );

  const mobileDetailsToggle = !detailsOpen && (
    <div className="flex items-center justify-between lg:hidden">
      <div className="flex items-center gap-2 text-xs text-yellow-300">
        <Star className="h-3.5 w-3.5 text-yellow-300" fill="currentColor" />
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
  );

  const descriptionSection = (
    <DescriptionContainer
      detailsOpen={detailsOpen}
      title={title}
      ratingLabel={formatRating(ratingAvg, ratingCount)}
      description={description}
    />
  );

  const footerActions = (
    <FooterActionsContainer
      onRate={onRate}
      hasLocation={hasLocation}
      onViewRoutes={() => {
        if (!hasLocation) return;
        setShowRoutes(true);
      }}
      detailsOpen={detailsOpen}
      onCloseDetails={() => setDetailsOpen(false)}
    />
  );

  return (
    <article className="glass-secondary border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col w-full h-[72vh] sm:h-[75vh] lg:h-[85vh] overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar flex flex-col gap-2">
        {headerSection}
        {mediaAndWeatherSection}
        {mobileDetailsToggle}
        {descriptionSection}
      </div>
      {footerActions}
      {showRoutes && location && (
        <ViewRoutesModal destination={location} onClose={() => setShowRoutes(false)} />
      )}
    </article>
  );
};
