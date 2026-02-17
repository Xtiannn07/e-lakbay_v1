import React, { useState } from 'react';
import GoogleMapReact from 'google-map-react';
import type { LocationData } from '../lib/locationTypes';

const Pin: React.FC<{ lat: number; lng: number; emoji: string; label: string }> = ({ emoji, label }) => (
  <div style={{ textAlign: 'center', transform: 'translate(-50%, -100%)' }}>
    <div style={{ fontSize: 28 }}>{emoji}</div>
    <span style={{ fontSize: 11, background: '#fff', padding: '2px 6px', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
      {label}
    </span>
  </div>
);

interface ViewRoutesModalProps {
  destination: LocationData;
  onClose: () => void;
}

export default function ViewRoutesModal({ destination, onClose }: ViewRoutesModalProps) {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState('idle'); // idle | loading | granted | denied | unsupported
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  function requestLocation() {
    if (!navigator.geolocation) { setStatus('unsupported'); return; }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      pos => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setStatus('granted'); },
      () => setStatus('denied'),
      { enableHighAccuracy: true }
    );
  }

  const hasCoords = typeof destination.lat === 'number' && typeof destination.lng === 'number';
  const googleMapsLink = !hasCoords
    ? 'https://www.google.com/maps'
    : userCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: 24,
        width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>🗺️ Get Directions</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <p style={{ margin: '0 0 16px', color: '#555' }}>
          📍 Destination: <strong>{destination.barangay ?? 'Unknown'}, {destination.municipality ?? 'Unknown'}</strong>
          {destination.address && <><br /><span style={{ fontSize: 12, color: '#888' }}>{destination.address}</span></>}
        </p>

        {!hasCoords && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p>⚠️ This location is missing coordinates.</p>
          </div>
        )}

        {/* IDLE */}
        {status === 'idle' && hasCoords && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ color: '#555', marginBottom: 16 }}>Allow location access to see directions from where you are.</p>
            <button onClick={requestLocation} style={{
              padding: '12px 24px', background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer'
            }}>
              📍 Use My Current Location
            </button>
            <br /><br />
            <a href={googleMapsLink} target="_blank" rel="noreferrer"
              style={{ color: '#2563eb', fontSize: 13 }}>
              Open in Google Maps without location ↗
            </a>
          </div>
        )}

        {/* LOADING */}
        {status === 'loading' && hasCoords && (
          <p style={{ textAlign: 'center', color: '#888', padding: '24px 0' }}>Getting your location...</p>
        )}

        {/* UNSUPPORTED */}
        {status === 'unsupported' && hasCoords && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p>⚠️ Your browser doesn't support location access.</p>
            <a href={googleMapsLink} target="_blank" rel="noreferrer"
              style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              Open in Google Maps ↗
            </a>
          </div>
        )}

        {/* DENIED */}
        {status === 'denied' && hasCoords && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p>⚠️ Location access was denied. You can still open directions in Google Maps.</p>
            <a href={googleMapsLink} target="_blank" rel="noreferrer"
              style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              Open Google Maps ↗
            </a>
          </div>
        )}

        {/* GRANTED — show map with route */}
        {status === 'granted' && userCoords && hasCoords && (
          <>
            <div style={{ height: 360, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              <GoogleMapReact
                bootstrapURLKeys={{ key: apiKey ?? '' }}
                defaultCenter={{ lat: destination.lat as number, lng: destination.lng as number }}
                defaultZoom={13}
                yesIWantToUseGoogleMapApiInternals
                onGoogleApiLoaded={({ map, maps }) => {
                  const directionsService = new maps.DirectionsService();
                  const directionsRenderer = new maps.DirectionsRenderer({ suppressMarkers: false });
                  directionsRenderer.setMap(map);
                  directionsService.route({
                    origin: new maps.LatLng(userCoords.lat, userCoords.lng),
                    destination: new maps.LatLng(destination.lat as number, destination.lng as number),
                    travelMode: maps.TravelMode.DRIVING,
                  }, (result, status) => {
                    if (status === 'OK') directionsRenderer.setDirections(result);
                  });
                }}
              >
                <Pin lat={userCoords.lat} lng={userCoords.lng} emoji="🔵" label="You" />
                <Pin lat={destination.lat as number} lng={destination.lng as number} emoji="📍" label={destination.barangay ?? 'Destination'} />
              </GoogleMapReact>
            </div>

            <a href={googleMapsLink} target="_blank" rel="noreferrer" style={{
              display: 'block', textAlign: 'center', padding: '12px',
              background: '#16a34a', color: '#fff', borderRadius: 10,
              textDecoration: 'none', fontWeight: 700, fontSize: 14
            }}>
              📱 Open in Google Maps App ↗
            </a>
          </>
        )}
      </div>
    </div>
  );
}