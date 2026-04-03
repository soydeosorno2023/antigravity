import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Place } from '../types';
import { optimizeImageUrl } from '../utils/image';
import { ElegantImage } from './ElegantImage';
import { motion } from 'framer-motion';

export function HomeViewHistory() {
  const [historyPlaces, setHistoryPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const historyIds = JSON.parse(localStorage.getItem('view_history') || '[]');
        if (historyIds.length > 0) {
          const places = await api.getPlacesByIds(historyIds);
          setHistoryPlaces(places);
        }
      } catch (error) {
        console.error("Error fetching view history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading || historyPlaces.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-6 bg-white dark:bg-gray-950"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Historial de lugares vistos</h2>
        <div className="flex overflow-x-auto gap-4 py-4 no-scrollbar -mx-6 px-6">
          {historyPlaces.map(place => (
            <Link 
              key={place.id} 
              to={`/lugar/${place.slug || place.id}`}
              className="flex-shrink-0 w-[140px] group block"
            >
              <div className="h-32 rounded-2xl overflow-hidden shadow-md mb-2">
                <ElegantImage 
                  src={optimizeImageUrl(place.profile_image_url, 300)} 
                  alt={place.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  containerClassName="w-full h-full"
                />
              </div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{place.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
