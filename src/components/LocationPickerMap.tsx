import React, { useEffect, useMemo, useRef, useState } from 'react';
import GoogleMapReact from 'google-map-react';
import type { LocationData } from '../lib/locationTypes';
import { getBarangays, getMunicipalities } from '../lib/data/ilocosSurData';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

const DEFAULT_CENTER = { lat: 17.1333, lng: 120.4167 };

interface PinProps {
  lat: number;
  lng: number;
}

const Pin: React.FC<PinProps> = () => (
  <div className="text-2xl -translate-x-1/2 -translate-y-full">📍</div>
);

interface LocationPickerMapProps {
  onLocationConfirmed: (data: LocationData) => void;
  initialCenter?: { lat: number; lng: number };
  initialLocation?: LocationData | null;
  hideIntro?: boolean;
  defaultPinMapOpen?: boolean;
  showBarangay?: boolean;
}

const toLocationData = (
  coords: { lat: number; lng: number } | null,
  municipality: string,
  barangay: string,
  includeBarangay: boolean = true,
): LocationData => ({
  lat: coords?.lat ?? null,
  lng: coords?.lng ?? null,
  address: municipality ? (includeBarangay && barangay ? `${barangay}, ${municipality}` : municipality) : null,
  municipality: municipality || null,
  barangay: includeBarangay ? (barangay || null) : null,
});

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  onLocationConfirmed,
  initialCenter,
  initialLocation,
  hideIntro = false,
  defaultPinMapOpen = false,
  showBarangay = true,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const initializedRef = useRef(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [municipality, setMunicipality] = useState('');
  const [barangay, setBarangay] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);

  const municipalities = useMemo(() => getMunicipalities(), []);
  const barangays = useMemo(() => (municipality ? getBarangays(municipality) : []), [municipality]);

  const center = useMemo(() => initialCenter ?? DEFAULT_CENTER, [initialCenter]);

  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  useEffect(() => {
    if (!initialLocation) {
      initializedRef.current = true;
      return;
    }

    setMunicipality(initialLocation.municipality ?? '');
    setBarangay(initialLocation.barangay ?? '');

    if (typeof initialLocation.lat === 'number' && typeof initialLocation.lng === 'number') {
      const coords = { lat: initialLocation.lat, lng: initialLocation.lng };
      setPin(coords);
      setMapCenter(coords);
    }

    initializedRef.current = true;
  }, [initialLocation]);

  useEffect(() => {
    if (!initializedRef.current) return;
    onLocationConfirmed(toLocationData(pin, municipality, barangay));
  }, [pin, municipality, barangay, onLocationConfirmed]);

  const geocodeAddress = async (query: string) => {
    if (!apiKey) {
      setErrorMessage('Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your env.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`,
      );
      const payload = await response.json();
      const result = payload.results?.[0];
      const location = result?.geometry?.location;
      if (location?.lat && location?.lng) {
        const coords = { lat: location.lat, lng: location.lng };
        setPin(coords);
        setMapCenter(coords);
      }
      setStatus('idle');
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      setErrorMessage('Unable to resolve the address. Try again.');
      setStatus('error');
    }
  };

  const handleMapClick = ({ lat, lng }: { lat: number; lng: number }) => {
    const coords = { lat, lng };
    setPin(coords);
    setMapCenter(coords);
  };

  const handleMunicipalityChange = (value: string) => {
    setMunicipality(value);
    setBarangay('');
    setPin(null);
    setErrorMessage(null);
  };

  const handleBarangayChange = async (value: string) => {
    setBarangay(value);
    if (!value || !municipality) return;
    await geocodeAddress(`${value}, ${municipality}, Ilocos Sur, Philippines`);
  };

  return (
    <div className="flex flex-col gap-3">
      {!hideIntro && (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3 text-xs text-white/70">
          Select a municipality{showBarangay ? ' and barangay' : ''}. The map preview is optional if you want to refine the pin.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-200/30 bg-red-500/20 px-3 py-2 text-xs text-red-100">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="location-municipality" className="text-xs text-white/60">Municipality / City</label>
          <select
            id="location-municipality"
            value={municipality}
            onChange={(event) => handleMunicipalityChange(event.target.value)}
            className="mt-1 w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-xs text-white"
          >
            <option value="">Select municipality</option>
            {municipalities.map((item) => (
              <option key={item} value={item} className="text-black">
                {item}
              </option>
            ))}
          </select>
        </div>
        {showBarangay && (
          <div>
            <label htmlFor="location-barangay" className="text-xs text-white/60">Barangay</label>
            <select
              id="location-barangay"
              value={barangay}
              onChange={(event) => void handleBarangayChange(event.target.value)}
              disabled={!municipality}
              className="mt-1 w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-xs text-white disabled:opacity-60"
            >
              <option value="">Select barangay</option>
              {barangays.map((item) => (
                <option key={item} value={item} className="text-black">
                  {item}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Accordion type="single" collapsible defaultValue={defaultPinMapOpen ? 'pin-map' : undefined}>
        <AccordionItem value="pin-map" className="border-white/10">
          <AccordionTrigger className="text-xs text-white/80">Pin map (optional)</AccordionTrigger>
          <AccordionContent>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3 text-xs text-white/70">
              Click on the map to refine the exact pin. This is optional.
            </div>
            <div className="mt-3 h-72 w-full overflow-hidden rounded-2xl border border-white/15">
              <GoogleMapReact
                bootstrapURLKeys={{ key: apiKey ?? '' }}
                center={pin ?? mapCenter}
                defaultZoom={12}
                onClick={handleMapClick}
              >
                {pin && <Pin lat={pin.lat} lng={pin.lng} />}
              </GoogleMapReact>
            </div>
            {status === 'loading' && (
              <p className="mt-2 text-xs text-white/60">Pinning the exact location...</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default LocationPickerMap;