import React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GoogleMapReact from 'google-map-react';
import type { LocationData } from '../lib/locationTypes';

const DEFAULT_CENTER = { lat: 17.1333, lng: 120.4167 };

interface MarkerProps {
  lat: number;
  lng: number;
  label?: string;
}

const Marker: React.FC<MarkerProps> = ({ label }) => (
  <div className="relative flex flex-col items-center -translate-x-1/2 -translate-y-full">
    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-red-500 border-2 border-white">
      <svg
        className="w-5 h-5 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
          clipRule="evenodd"
        />
      </svg>
    </div>
    {label && (
      <span className="mt-1 px-2 py-0.5 text-[10px] font-medium bg-white/95 text-gray-800 rounded-full shadow-md whitespace-nowrap max-w-32 truncate">
        {label}
      </span>
    )}
    <div className="absolute w-2 h-2 rotate-45 top-8 bg-red-500" />
  </div>
);

interface RouteMapViewProps {
  destination: LocationData;
  destinationName?: string;
  onClose: () => void;
}

export const RouteMapView: React.FC<RouteMapViewProps> = ({
  destination,
  destinationName,
  onClose,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const hasCoords =
    typeof destination.lat === 'number' && typeof destination.lng === 'number';

  const destinationCoords = hasCoords
    ? { lat: destination.lat as number, lng: destination.lng as number }
    : DEFAULT_CENTER;

  const googleMapsLink = !hasCoords
    ? destination.municipality
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([destination.barangay, destination.municipality, 'Ilocos Sur'].filter(Boolean).join(', '))}`
      : 'https://www.google.com/maps'
    : `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;

  const displayName = destinationName || destination.barangay || 'Destination';
  const locationLabel = [destination.barangay, destination.municipality]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden glass-secondary border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{displayName}</h2>
              {locationLabel && (
                <p className="text-xs text-white/60">{locationLabel}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close map"
          >
            <svg
              className="w-5 h-5 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Map */}
        <div className="h-[250px] sm:h-[350px] md:h-[480px]">
          {!hasCoords ? (
            <div className="h-full flex items-center justify-center bg-black/30">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-white/60 text-sm mb-2">
                  Exact coordinates not available
                </p>
                {locationLabel && (
                  <p className="text-white/40 text-xs">
                    Click below to search for "{locationLabel}" on Google Maps
                  </p>
                )}
              </div>
            </div>
          ) : (
            <GoogleMapReact
              bootstrapURLKeys={{ key: apiKey ?? '' }}
              center={destinationCoords}
              defaultZoom={15}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                fullscreenControl: true,
                mapTypeControl: true,
                streetViewControl: true,
              }}
            >
              <Marker
                lat={destinationCoords.lat}
                lng={destinationCoords.lng}
                label={displayName}
              />
            </GoogleMapReact>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-xl glass-button text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Open in Google Maps
            <svg
              className="w-3 h-3 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default RouteMapView;
