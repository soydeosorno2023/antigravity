import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, ChevronLeft, Heart, Star, Share2, 
  CheckCircle2, Clock, Info, Shield, CreditCard
} from 'lucide-react';
import { api } from '../services/api';
import { Place, Review } from '../types';
import { optimizeImageUrl } from '../utils/image';
import { Skeleton } from '../components/Skeleton';
import { ElegantImage } from '../components/ElegantImage';
import { useFavorites } from '../context/FavoritesContext';
import { SEO } from '../components/SEO';
import './PlaceDetail.css';

export function PlaceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (slug) {
      setLoading(true);
      api.getPlaceBySlug(slug)
        .then(data => {
          setPlace(data);
          return api.getReviews(data.id);
        })
        .then(reviewsData => setReviews(reviewsData))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return <div className="pd-loading"><Skeleton className="w-full h-screen" /></div>;
  if (!place) return <div className="pd-error">Place not found</div>;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  return (
    <div className="place-detail-modern">
      <SEO title={place.name} description={place.full_description} />

      {/* Hero Header */}
      <div className="pd-hero-modern">
        <ElegantImage
          src={optimizeImageUrl(place.cover_image_url || place.profile_image_url, 1200)}
          alt={place.name}
          className="pd-hero-img"
          containerClassName="pd-hero-img-container"
        />
        <div className="pd-hero-overlay-modern" />
        
        <div className="pd-hero-controls">
          <button onClick={() => navigate(-1)} className="pd-control-btn glass">
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => toggleFavorite(place.id)} 
            className={`pd-control-btn glass ${isFavorite(place.id) ? 'favorite' : ''}`}
          >
            <Heart size={24} fill={isFavorite(place.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pd-content-modern">
        <div className="pd-header-info">
          <div className="pd-rating-badge">
            <Star size={14} fill="var(--primary)" color="var(--primary)" />
            <span className="rating-val">{averageRating}</span>
            <span className="rating-count">({reviews.length} reviews)</span>
          </div>
          
          <h1 className="pd-title-modern">{place.name}</h1>
          
          <div className="pd-location-modern">
            <MapPin size={18} className="text-primary" />
            <span>{place.address}</span>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="pd-tabs-modern">
          {['Overview', 'Details', 'Costs'].map(tab => (
            <button 
              key={tab}
              className={`pd-tab-modern-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="pd-tab-content-modern">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'Overview' && (
                <div className="pd-overview-content">
                  <p className="pd-description-modern">
                    {place.full_description || place.description}
                  </p>
                  <div className="pd-amenities-mini">
                    <div className="amenity-item"><Shield size={18} /> Safe & Secure</div>
                    <div className="amenity-item"><Clock size={18} /> 24/7 Access</div>
                    <div className="amenity-item"><Info size={18} /> Local Guide</div>
                  </div>
                </div>
              )}
              {activeTab === 'Details' && (
                <div className="pd-details-content">
                  <h3 className="section-subtitle-modern">Location & Details</h3>
                  <div className="details-grid-modern">
                    <div className="detail-row"><strong>Address:</strong> {place.address}</div>
                    <div className="detail-row"><strong>Category:</strong> {place.category_name}</div>
                    <div className="detail-row"><strong>Phone:</strong> {place.phone}</div>
                  </div>
                </div>
              )}
              {activeTab === 'Costs' && (
                <div className="pd-costs-content">
                  <h3 className="section-subtitle-modern">Pricing Info</h3>
                  <p className="pd-description-modern">
                    Prices vary by season and group size. Contact the host for a custom quote.
                  </p>
                  <div className="price-card-modern-mini">
                    <CreditCard size={20} />
                    <span>Booking deposit: $200 (Refundable)</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Booking Bar */}
      <footer className="pd-booking-bar glass">
        <div className="price-tag-modern">
          <span className="price-amount">$1,260</span>
          <span className="price-label">/night</span>
        </div>
        <button className="btn-primary booking-btn">
          Check availability
        </button>
      </footer>
    </div>
  );
}
