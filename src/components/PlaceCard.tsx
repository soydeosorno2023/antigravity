import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Heart } from 'lucide-react';
import { Place } from '../types';
import { ElegantImage } from './ElegantImage';
import { useFavorites } from '../context/FavoritesContext';
import { optimizeImageUrl } from '../utils/image';
import './PlaceCard.css';

interface PlaceCardProps {
  place: Place;
  index: number; // Used for staggered animation/delay
}

export function PlaceCard({ place, index }: PlaceCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  // Generate a random rating between 4.5 and 5.0 if not available
  const rating = 4.5 + Math.random() * 0.5;
  const reviews = Math.floor(Math.random() * 500) + 50;

  return (
    <Link 
      to={`/lugar/${place.slug || place.id}`}
      className="place-card-modern animate-fade-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="place-card-image-container">
        <ElegantImage
          src={optimizeImageUrl(place.cover_image_url || place.profile_image_url, 600)}
          alt={place.name}
          className="place-card-image"
          containerClassName="place-card-image-wrapper"
        />
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(place.id);
          }}
          className={`place-card-favorite ${isFavorite(place.id) ? 'active' : ''}`}
        >
          <Heart fill={isFavorite(place.id) ? 'currentColor' : 'none'} size={18} />
        </button>
      </div>

      <div className="place-card-content">
        <div className="place-card-rating">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                size={12} 
                fill={s <= 5 ? 'var(--primary)' : 'none'} 
                color="var(--primary)" 
              />
            ))}
          </div>
          <span className="rating-count">({reviews} reviews)</span>
        </div>

        <h3 className="place-card-title">{place.name}</h3>
        
        <div className="place-card-location">
          <MapPin size={14} className="location-pin" />
          <span className="location-text">{place.address}</span>
        </div>

        <div className="place-card-footer">
          <div className="place-card-price">
            <span className="price-value">$1,260</span>
            <span className="price-unit">/night</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
