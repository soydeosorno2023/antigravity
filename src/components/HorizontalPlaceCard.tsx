import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Dog, ParkingCircle, Wifi } from 'lucide-react';
import { Place } from '../types';
import { ElegantImage } from './ElegantImage';
import { useFavorites } from '../context/FavoritesContext';
import { optimizeImageUrl } from '../utils/image';

interface HorizontalPlaceCardProps {
  place: Place;
  distance?: number | null;
  compact?: boolean;
}

export function HorizontalPlaceCard({ place, distance, compact = false }: HorizontalPlaceCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <Link 
      to={`/lugar/${place.slug || place.id}`}
      className={`bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 block cursor-pointer ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
        {/* Circular Profile Image */}
        <div className={`relative flex-shrink-0 ${compact ? 'w-14 h-14' : 'w-20 h-20'}`}>
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-800 shadow-sm">
            <ElegantImage
              src={optimizeImageUrl(place.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${place.name}`, 160)}
              alt={place.name}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full"
            />
          </div>
          {/* Favorite Button Overlay */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(place.id);
            }}
            className="absolute -top-1 -right-1 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-400 hover:text-red-500 transition-colors"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite(place.id) ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
  
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold text-[#1A2B3C] dark:text-white truncate leading-tight mb-0.5`}>
              {place.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {place.is_pet_friendly && <Dog className="w-3.5 h-3.5 text-gray-400" />}
              {place.has_parking && <ParkingCircle className="w-3.5 h-3.5 text-gray-400" />}
              {place.has_wifi && <Wifi className="w-3.5 h-3.5 text-gray-400" />}
            </div>
          </div>
          
          <p className={`text-gray-400 dark:text-gray-500 ${compact ? 'text-xs' : 'text-sm'} truncate mb-2`}>
            {place.address}
          </p>
  
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-[#F5B027] fill-[#F5B027]`} />
              <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-[#1A2B3C] dark:text-white`}>4.8</span>
              {distance !== null && distance !== undefined && (
                <span className="text-[10px] text-gray-400 font-medium ml-1">
                  {distance.toFixed(1)} km
                </span>
              )}
            </div>
            
            <span className={`text-[#008080] dark:text-teal-400 font-bold ${compact ? 'text-xs' : 'text-sm'} hover:underline`}>
              Ver más
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
