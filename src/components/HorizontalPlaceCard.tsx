import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Dog, ParkingCircle, Wifi } from 'lucide-react';
import { Place } from '../types';
import { ElegantImage } from './ElegantImage';
import { useFavorites } from '../context/FavoritesContext';
import { optimizeImageUrl } from '../utils/image';
import './HorizontalPlaceCard.css';

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
      className={`h-place-card ${compact ? 'compact' : ''}`}
    >
      <div className="h-place-card-inner">
        {/* Circular Profile Image */}
        <div className="h-place-img-wrapper">
          <div className="h-place-img-circle">
            <ElegantImage
              src={optimizeImageUrl(place.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${place.name}`, 160)}
              alt={place.name}
              className="img-cover"
              containerClassName="img-cover"
            />
          </div>
          {/* Favorite Button Overlay */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(place.id);
            }}
            className="h-place-fav-btn"
          >
            <Heart style={{ width: '1rem', height: '1rem', fill: isFavorite(place.id) ? 'var(--error)' : 'none', color: isFavorite(place.id) ? 'var(--error)' : 'currentColor' }} />
          </button>
        </div>
  
        {/* Content */}
        <div className="h-place-content">
          <div className="h-place-header">
            <h3 className="h-place-title">
              {place.name}
            </h3>
            <div className="h-place-icons">
              {place.is_pet_friendly && <Dog style={{ width: '0.875rem' }} />}
              {place.has_parking && <ParkingCircle style={{ width: '0.875rem' }} />}
              {place.has_wifi && <Wifi style={{ width: '0.875rem' }} />}
            </div>
          </div>
          
          <p className="h-place-address">
            {place.address}
          </p>
  
          <div className="h-place-footer">
            <div className="h-place-rating">
              <Star style={{ width: compact ? '0.75rem' : '1rem', color: 'var(--primary)', fill: 'var(--primary)' }} />
              <span className="h-place-rating-text">4.8</span>
              {distance !== null && distance !== undefined && (
                <span className="h-place-distance">
                  {distance.toFixed(1)} km
                </span>
              )}
            </div>
            
            <span className="h-place-link">
              Ver más
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
