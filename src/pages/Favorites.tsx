import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, ChevronRight, Navigation, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Place } from '../types';
import { useLocation } from '../context/LocationContext';
import { useFavorites } from '../context/FavoritesContext';
import { calculateDistance } from '../utils/distance';
import { HorizontalPlaceCard } from '../components/HorizontalPlaceCard';
import { SEO } from '../components/SEO';

export function Favorites() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const { location } = useLocation();

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const favPlaces = await api.getMyFavorites();
        setPlaces(favPlaces);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!favLoading) {
      fetchFavorites();
    }
  }, [favorites, favLoading]);

  const sortedPlaces = React.useMemo(() => {
    if (!location || places.length === 0) return places;
    
    return [...places].sort((a, b) => {
      const latA = a.lat || 0;
      const lngA = a.lng || 0;
      const latB = b.lat || 0;
      const lngB = b.lng || 0;

      if (latA === 0 || lngA === 0) return 1;
      if (latB === 0 || lngB === 0) return -1;

      const distA = calculateDistance(location.lat, location.lng, latA, lngA);
      const distB = calculateDistance(location.lat, location.lng, latB, lngB);
      return distA - distB;
    });
  }, [places, location]);

  if (favLoading || (loading && places.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F5B027] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-4xl mx-auto min-h-screen px-6 pt-6">
      <SEO 
        title="Mis Favoritos"
        description="Tus lugares favoritos guardados en Mira Osorno."
      />
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Mis Favoritos</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {places.length} {places.length === 1 ? 'lugar guardado' : 'lugares guardados'}
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {places.length > 0 ? (
          <div className="grid gap-4">
            {sortedPlaces.map((place) => {
              const distance = location ? calculateDistance(location.lat, location.lng, place.lat, place.lng) : null;
              
              return (
                <motion.div
                  key={place.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <HorizontalPlaceCard place={place} distance={distance} />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 px-6"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No tienes favoritos aún</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8">
              Explora los mejores lugares de Osorno y guarda los que más te gusten.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-[#F5B027] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#e5a017] transition-all shadow-lg shadow-orange-100 dark:shadow-none"
            >
              Explorar lugares
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
