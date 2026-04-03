import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { calculateDistance } from '../utils/distance';

interface Location {
  lat: number;
  lng: number;
}

interface LocationContextType {
  location: Location;
  address: string;
  street: string;
  city: string;
  loading: boolean;
  locationLoading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  setManualAddress: (newAddress: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const OSORNO_CENTER = { lat: -40.5739, lng: -73.1331 };

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>(OSORNO_CENTER);
  const [address, setAddress] = useState<string>('OSORNO');
  const [street, setStreet] = useState<string>('');
  const [city, setCity] = useState<string>('OSORNO');
  const [loading, setLoading] = useState<boolean>(true);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const addressRef = useRef<string>('OSORNO');
  const lastGeocodePos = useRef<Location | null>(null);

  const updateAddress = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `/api/geocode?lat=${latitude}&lon=${longitude}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding API error');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const addr = data.address;
      
      if (!addr) {
        setAddress('OSORNO');
        addressRef.current = 'OSORNO';
        return;
      }

      // Helper to clean strings and remove "CHILE"
      const clean = (str: string | undefined) => {
        if (!str) return '';
        // Remove "CHILE" or ", CHILE" case-insensitively
        return str.replace(/,?\s*CHILE/gi, '').trim();
      };

      // Extract street and city with more robust fallbacks
      const streetName = clean(
        addr.road || 
        addr.pedestrian || 
        addr.street || 
        addr.path || 
        addr.cycleway || 
        addr.footway || 
        addr.suburb || 
        addr.neighbourhood || 
        addr.city_district || 
        addr.residential || 
        addr.amenity || 
        addr.shop || 
        addr.tourism || 
        addr.building || 
        addr.house_name || 
        addr.place || 
        addr.square || 
        addr.hamlet || 
        addr.village || 
        addr.allotments || 
        ''
      );

      const number = addr.house_number || '';
      
      // City part
      const cityName = clean(addr.city || addr.town || addr.village || addr.municipality || addr.county || 'OSORNO');
      
      const streetAndNumber = number ? `${streetName} ${number}` : streetName;
      
      // Format strictly as "STREET, CITY"
      let fullAddress = '';
      
      // Ensure we don't have "OSORNO, OSORNO" or empty street
      if (streetAndNumber && streetAndNumber.toLowerCase() !== cityName.toLowerCase()) {
        fullAddress = `${streetAndNumber}, ${cityName}`.toUpperCase();
        setStreet(streetAndNumber);
      } else {
        // If we only have the city or street is same as city, show a district/sector
        const district = clean(addr.suburb || addr.neighbourhood || addr.city_district);
        
        if (district && district.toLowerCase() !== cityName.toLowerCase()) {
          fullAddress = `${district}, ${cityName}`.toUpperCase();
          setStreet(district);
        } else {
          // Final fallback
          fullAddress = cityName.toUpperCase();
          setStreet('');
        }
      }
      
      setCity(cityName.toUpperCase());
      setAddress(fullAddress);
      addressRef.current = fullAddress;
      lastGeocodePos.current = { lat: latitude, lng: longitude };
    } catch (err) {
      console.error('Error reverse geocoding:', err);
      // Don't overwrite if we already have an address
      if (address === 'OSORNO') {
        setAddress('OSORNO');
        addressRef.current = 'OSORNO';
      }
    }
  };

  const refreshLocation = async () => {
    setLocationLoading(true);
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            setLocation({ lat: latitude, lng: longitude });
            await updateAddress(latitude, longitude);
          } catch (err) {
            console.error('Error in refreshLocation success callback:', err);
          } finally {
            setLocationLoading(false);
            resolve();
          }
        },
        (err) => {
          console.error('Geolocation refresh error:', err);
          setError(err.message);
          setLocationLoading(false);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const setManualAddress = (newAddress: string) => {
    setAddress(newAddress.toUpperCase());
    addressRef.current = newAddress.toUpperCase();
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setAddress('OSORNO');
      setLoading(false);
      return;
    }

    // Initial position
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });
          await updateAddress(latitude, longitude);
        } catch (err) {
          console.error('Error in initial geolocation success callback:', err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        // PERMISSION_DENIED = 1
        if (err.code === 1) {
          console.warn('Geolocation permission denied, using default location.');
        } else {
          console.error('Initial Geolocation error:', err);
        }
        setError(err.message);
        setAddress('OSORNO');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );

    // Watch position for updates
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLoc = { lat: latitude, lng: longitude };
        setLocation(newLoc);
        
        // Update address if we moved more than 200 meters since last geocode
        if (lastGeocodePos.current) {
          const dist = calculateDistance(
            latitude, 
            longitude, 
            lastGeocodePos.current.lat, 
            lastGeocodePos.current.lng
          );
          if (dist > 0.2) { // 200 meters
            updateAddress(latitude, longitude).catch(err => console.error('Error updating address on watch:', err));
          }
        } else if (addressRef.current === 'OSORNO') {
          // If we only have the default, try to get a real one
          updateAddress(latitude, longitude).catch(err => console.error('Error updating initial address on watch:', err));
        }
      },
      (err) => {
        // PERMISSION_DENIED = 1
        if (err.code !== 1) {
          console.warn('Geolocation watch error:', err);
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <LocationContext.Provider value={{ 
      location, 
      address, 
      street, 
      city, 
      loading, 
      locationLoading, 
      error, 
      refreshLocation,
      setManualAddress
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
