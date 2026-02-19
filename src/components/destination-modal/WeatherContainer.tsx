import React from 'react';
import { Droplet, MapPin, Wind } from 'lucide-react';
import type { CurrentWeatherData } from '../../lib/weather';

interface WeatherContainerProps {
  detailsOpen: boolean;
  title: string;
  todayLabel: string;
  weatherLoading: boolean;
  weather: CurrentWeatherData | null;
  WeatherIcon: React.ComponentType<{ className?: string }>;
}

export const WeatherContainer: React.FC<WeatherContainerProps> = ({
  detailsOpen,
  title,
  todayLabel,
  weatherLoading,
  weather,
  WeatherIcon,
}) => (
  <div className="glass border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 lg:max-w-[280px]">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
        <MapPin className="h-4 w-4 text-white/70" />
        <span>{title}</span>
      </div>
      <span className="text-[10px] sm:text-xs text-white/60">{todayLabel}</span>
    </div>

    <div className={`${detailsOpen ? 'block' : 'hidden'} lg:block`}>
      <div className="flex items-center gap-3 sm:gap-4">
        <WeatherIcon className="h-10 w-10 sm:h-16 sm:w-16 text-white/80" />
        {weatherLoading ? (
          <div>
            <div className="text-xl sm:text-4xl font-bold">--°C</div>
            <div className="text-xs sm:text-sm text-white/60">Loading weather...</div>
          </div>
        ) : weather ? (
          <div>
            <div className="text-xl sm:text-4xl font-bold">{Math.round(weather.tempC)}°C</div>
            <div className="text-xs sm:text-sm text-white/60">{weather.condition}</div>
          </div>
        ) : (
          <div>
            <div className="text-xl sm:text-4xl font-bold">--°C</div>
            <div className="text-xs sm:text-sm text-white/60">Weather unavailable</div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:text-sm text-white/70">
        <div className="flex items-center gap-1">
          <Droplet className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
          <span>Humidity {weather && weather.humidity != null ? `${Math.round(weather.humidity)}%` : '--'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
          <span>Wind {weather && weather.windKph != null ? `${Math.round(weather.windKph)} km/h` : '--'}</span>
        </div>
      </div>
    </div>
  </div>
);
