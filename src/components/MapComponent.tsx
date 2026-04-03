import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '../types';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Navigation } from 'lucide-react';
import { HorizontalPlaceCard } from './HorizontalPlaceCard';
import { calculateDistance } from '../utils/distance';
import { useLocation } from '../context/LocationContext';
import { ElegantImage } from './ElegantImage';
import { optimizeImageUrl } from '../utils/image';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: -40.5739,
  lng: -73.1331
};

interface MapComponentProps {
  places: Place[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

const libraries: ("places")[] = ["places"];

const modernMapStyle = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#7c93a3" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#1A2B3C" }, { "weight": "bold" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#f8fafc" }]
  },
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#e2e8f0" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#cbd5e1" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#bae6fd" }]
  }
];

export function MapComponent({ places, center = defaultCenter, zoom = 14 }: MapComponentProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isKeyValid = apiKey && apiKey.startsWith('AIza') && apiKey.length > 20;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: isKeyValid ? apiKey : '',
    version: 'weekly',
    libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const { location: userLocation } = useLocation();
  const [specificError, setSpecificError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Google Maps JavaScript API error')) {
        if (message.includes('ApiNotActivatedMapError')) {
          setSpecificError('La "Maps JavaScript API" no está habilitada en tu consola de Google Cloud.');
        } else if (message.includes('RefererNotAllowedMapError')) {
          setSpecificError('Tu dominio no está autorizado en las restricciones de la API Key.');
        } else if (message.includes('InvalidKeyMapError')) {
          setSpecificError('La API Key proporcionada no es válida.');
        } else if (message.includes('BillingNotEnabledMapError')) {
          setSpecificError('Debes habilitar la facturación en Google Cloud para usar mapas.');
        } else if (message.includes('Geocoding Service')) {
          setSpecificError('La "Geocoding API" no está habilitada o autorizada para esta API Key.');
        }
      }
      originalConsoleError.apply(console, args);
    };
    return () => { console.error = originalConsoleError; };
  }, []);

  const validPlaces = places.filter(p => 
    p.lat !== null && 
    p.lng !== null && 
    !isNaN(Number(p.lat)) && 
    !isNaN(Number(p.lng)) &&
    (Number(p.lat) !== 0 || Number(p.lng) !== 0)
  );

  const onLoad = useCallback(function callback(m: google.maps.Map) {
    setMap(m);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && validPlaces.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validPlaces.forEach(place => {
        bounds.extend({ lat: Number(place.lat), lng: Number(place.lng) });
      });
      map.fitBounds(bounds);
      
      if (validPlaces.length === 1) {
        const listener = google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom()! > 15) map.setZoom(15);
          google.maps.event.removeListener(listener);
        });
      }
    }
  }, [map, validPlaces]);

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    if (map) {
      map.panTo({ lat: Number(place.lat), lng: Number(place.lng) });
      map.setZoom(16);
    }
  };

  if (!isKeyValid) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
        <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Configuración de Mapa Requerida</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
          El mapa interactivo requiere una API Key de Google Maps válida.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full bg-red-50 dark:bg-red-900/10 flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem] border-2 border-red-100 dark:border-red-900/20">
        <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">Error de Conexión</h3>
        <p className="text-red-600 dark:text-red-400 text-sm max-w-xs">{specificError || "No se pudo cargar el mapa."}</p>
      </div>
    );
  }

  if (!isLoaded) return <div className="w-full h-full bg-gray-100 animate-pulse rounded-[2rem]" />;

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: modernMapStyle,
          disableDefaultUI: true,
          zoomControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy'
        }}
      >
        {userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng) && typeof google !== 'undefined' && (
          <OverlayViewF
            position={userLocation}
            mapPaneName="overlayMouseTarget"
          >
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <div className="w-5 h-5 bg-sky-500 rounded-full border-4 border-white shadow-lg ring-4 ring-sky-500/30 animate-pulse" />
            </div>
          </OverlayViewF>
        )}

        {validPlaces.map((place) => (
          <OverlayViewF
            key={place.id}
            position={{ lat: Number(place.lat), lng: Number(place.lng) }}
            mapPaneName="overlayMouseTarget"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => handleMarkerClick(place)}
              className="relative cursor-pointer -translate-x-1/2 -translate-y-full pb-2"
            >
              <div className={`relative w-12 h-12 rounded-full border-4 shadow-xl overflow-hidden transition-all duration-300 ${
                selectedPlace?.id === place.id ? 'border-teal-500 scale-125' : 'border-white'
              }`}>
                <ElegantImage 
                  src={optimizeImageUrl(place.profile_image_url || `https://picsum.photos/seed/${place.id}/100/100`, 100)} 
                  alt={place.name}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                  sizes="48px"
                />
              </div>
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 transition-colors duration-300 ${
                selectedPlace?.id === place.id ? 'bg-teal-500' : 'bg-white'
              }`} />
            </motion.div>
          </OverlayViewF>
        ))}
      </GoogleMap>

      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-12 left-4 right-4 z-30 pointer-events-none"
          >
            <div className="max-w-sm mx-auto pointer-events-auto relative">
              <button 
                onClick={() => setSelectedPlace(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-md z-20 transition-colors"
              >
                ×
              </button>
              <HorizontalPlaceCard 
                place={selectedPlace} 
                distance={userLocation ? calculateDistance(userLocation.lat, userLocation.lng, Number(selectedPlace.lat), Number(selectedPlace.lng)) : null}
                compact={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedPlace && validPlaces.length > 1 && (
        <div className="absolute bottom-12 left-0 right-0 px-4 pointer-events-none">
          <div className="max-w-4xl mx-auto overflow-x-auto no-scrollbar flex gap-4 pointer-events-auto pb-2">
            {validPlaces.map((place) => (
              <div 
                key={place.id}
                onClick={() => handleMarkerClick(place)}
                className={`flex-shrink-0 w-64 transition-all cursor-pointer ${
                  selectedPlace?.id === place.id ? 'scale-105' : ''
                }`}
              >
                <HorizontalPlaceCard 
                  place={place} 
                  distance={userLocation ? calculateDistance(userLocation.lat, userLocation.lng, Number(place.lat), Number(place.lng)) : null}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute top-6 right-6 flex flex-col gap-2 pointer-events-auto">
        <button 
          onClick={() => {
            if (map && userLocation) {
              map.panTo(userLocation);
              map.setZoom(15);
            }
          }}
          className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-600 hover:text-teal-600 transition-colors"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
