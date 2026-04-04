import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { MapPin, Star, ChevronLeft, Map as MapIcon, List as ListIcon, Navigation, Heart, Dog, ParkingCircle, Wifi, Filter, Check, ChevronDown, Sun, Moon, Tag } from 'lucide-react';
import { api } from '../services/api';
import { Place, Category, Subcategory } from '../types';
import { PlaceCardSkeleton } from '../components/Skeleton';
import { MapComponent } from '../components/MapComponent';
import { HorizontalPlaceCard } from '../components/HorizontalPlaceCard';
import { useFavorites } from '../context/FavoritesContext';
import { useLocation } from '../context/LocationContext';
import { useData } from '../context/DataContext';
import { calculateDistance } from '../utils/distance';
import { ElegantImage } from '../components/ElegantImage';
import { LoginModal } from '../components/LoginModal';
import { SEO } from '../components/SEO';
import './CategoryView.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

interface Filters {
  petFriendly: boolean;
  parking: boolean;
  wifi: boolean;
}

export function CategoryView() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, loading: dataLoading } = useData();
  const [places, setPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>(slug ? 'list' : 'map');
  const [filters, setFilters] = useState<Filters>({
    petFriendly: false,
    parking: false,
    wifi: false
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);
  const { location: userLocation } = useLocation();
  const { isFavorite, toggleFavorite, isLoginModalOpen, setIsLoginModalOpen } = useFavorites();

  useEffect(() => {
    if (!slug) {
      setViewMode('map');
    }
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    let unsubPlaces: (() => void) | undefined;

    const fetchCategoryAndSubscribe = async () => {
      try {
        const catData = slug ? categories.find(c => c.slug === slug) : null;
        setCategory(catData || null);
        setSelectedSubcategoryId(null); // Reset subcategory selection

        if (catData) {
          const subs = await api.getSubcategories(catData.id);
          setSubcategories(subs);
        }

        unsubPlaces = api.subscribeToPlaces(
          { categoryId: catData?.id },
          (placesData) => {
            setPlaces(placesData);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error fetching category:", err);
        setLoading(false);
      }
    };

    if (!dataLoading) {
      fetchCategoryAndSubscribe();
    }

    return () => {
      if (unsubPlaces) unsubPlaces();
    };
  }, [slug, categories, dataLoading]);

  const filteredPlaces = React.useMemo(() => {
    return places.filter(place => {
      // Ensure we have valid coordinates for the map view if needed
      if (viewMode === 'map' && (!place.lat || !place.lng)) return false;
      
      if (selectedSubcategoryId && place.subcategory_id !== selectedSubcategoryId) return false;
      if (filters.petFriendly && !place.is_pet_friendly) return false;
      if (filters.parking && !place.has_parking) return false;
      if (filters.wifi && !place.has_wifi) return false;
      return true;
    });
  }, [places, filters, selectedSubcategoryId, viewMode]);

  const sortedPlaces = React.useMemo(() => {
    if (!userLocation || filteredPlaces.length === 0) return filteredPlaces;
    
    return [...filteredPlaces].sort((a, b) => {
      const latA = a.lat || 0;
      const lngA = a.lng || 0;
      const latB = b.lat || 0;
      const lngB = b.lng || 0;

      if (latA === 0 || lngA === 0) return 1;
      if (latB === 0 || lngB === 0) return -1;

      const distA = calculateDistance(userLocation.lat, userLocation.lng, latA, lngA);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, latB, lngB);
      return distA - distB;
    });
  }, [filteredPlaces, userLocation]);

  const toggleFilter = (filter: keyof Filters) => {
    setFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="category-view">
      <SEO 
        title={category?.name || 'Explorar'}
        description={`Descubre los mejores lugares en la categoría ${category?.name || slug} en Osorno, Chile. Encuentra direcciones, fotos y más.`}
        canonical={`/categoria/${slug}`}
      />
      <div className="category-header-section">
        <div className="category-header-top">
          <div className="category-title-row">
            <Link to="/" className="category-back-btn">
              <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
            </Link>
            <div style={{ minWidth: 0 }}>
              <h1 className="category-title">
                {loading ? <div style={{ height: '2rem', width: '8rem', backgroundColor: 'var(--card-bg)', borderRadius: '0.5rem' }} /> : (category?.name || 'Explorar')}
              </h1>
              <div className="category-subtitle">
                {loading ? <div style={{ height: '1rem', width: '6rem', backgroundColor: 'var(--card-bg)', borderRadius: '0.5rem', marginTop: '0.25rem' }} /> : `${filteredPlaces.length} lugares encontrados`}
              </div>
            </div>
          </div>

          <div className="category-filters-row">
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsSubcategoryOpen(false);
                }}
                className={`filter-toggle-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
              >
                <Filter style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span style={{ backgroundColor: 'var(--primary)', color: 'white', width: '1rem', height: '1rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0, transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                      onClick={() => setIsFilterOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="filter-dropdown"
                    >
                      <div className="filter-dropdown-content">
                        <button
                          onClick={() => toggleFilter('petFriendly')}
                          className={`filter-option ${filters.petFriendly ? 'active' : ''}`}
                        >
                          <div className="filter-option-left">
                            <div className="filter-option-icon">
                              <Dog style={{ width: '1rem', height: '1rem' }} />
                            </div>
                            <span className="filter-option-text">Mascotas</span>
                          </div>
                          {filters.petFriendly && <Check style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />}
                        </button>

                        <button
                          onClick={() => toggleFilter('parking')}
                          className={`filter-option ${filters.parking ? 'active' : ''}`}
                        >
                          <div className="filter-option-left">
                            <div className="filter-option-icon">
                              <ParkingCircle style={{ width: '1rem', height: '1rem' }} />
                            </div>
                            <span className="filter-option-text">Estacionamiento</span>
                          </div>
                          {filters.parking && <Check style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />}
                        </button>

                        <button
                          onClick={() => toggleFilter('wifi')}
                          className={`filter-option ${filters.wifi ? 'active' : ''}`}
                        >
                          <div className="filter-option-left">
                            <div className="filter-option-icon">
                              <Wifi style={{ width: '1rem', height: '1rem' }} />
                            </div>
                            <span className="filter-option-text">Wi-Fi</span>
                          </div>
                          {filters.wifi && <Check style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />}
                        </button>
                      </div>
                      
                      {activeFiltersCount > 0 && (
                        <div className="filter-clear">
                          <button
                            onClick={() => setFilters({ petFriendly: false, parking: false, wifi: false })}
                            className="filter-clear-btn"
                          >
                            Limpiar filtros
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setIsSubcategoryOpen(!isSubcategoryOpen);
                  setIsFilterOpen(false);
                }}
                disabled={subcategories.length === 0}
                className={`filter-toggle-btn ${selectedSubcategoryId ? 'active' : ''}`}
              >
                <Tag style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedSubcategoryId 
                    ? subcategories.find(s => s.id === selectedSubcategoryId)?.name 
                    : 'Tipos'}
                </span>
                <ChevronDown style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0, transform: isSubcategoryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {isSubcategoryOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                      onClick={() => setIsSubcategoryOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="filter-dropdown filter-dropdown-centered"
                    >
                      <div className="filter-dropdown-content">
                        <button
                          onClick={() => {
                            setSelectedSubcategoryId(null);
                            setIsSubcategoryOpen(false);
                          }}
                          className={`filter-option ${!selectedSubcategoryId ? 'active' : ''}`}
                        >
                          <span className="filter-option-text">Todas</span>
                          {!selectedSubcategoryId && <Check style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />}
                        </button>

                        {subcategories.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setSelectedSubcategoryId(sub.id);
                              setIsSubcategoryOpen(false);
                            }}
                            className={`filter-option ${selectedSubcategoryId === sub.id ? 'active' : ''}`}
                          >
                            <span className="filter-option-text">{sub.name}</span>
                            {selectedSubcategoryId === sub.id && <Check style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="filter-toggle-btn"
            >
              {viewMode === 'list' ? (
                <>
                  <MapIcon style={{ width: '1rem', height: '1rem' }} />
                  <span>Mapa</span>
                </>
              ) : (
                <>
                  <ListIcon style={{ width: '1rem', height: '1rem' }} />
                  <span>Lista</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="category-content-area">
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              variants={containerVariants}
              className="list-view-container"
            >
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => <PlaceCardSkeleton key={i} />)
              ) : (
                sortedPlaces.map((place) => {
                  const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng) : null;
                  
                  return (
                    <motion.div
                      key={place.id}
                      variants={itemVariants}
                    >
                      <HorizontalPlaceCard place={place} distance={distance} />
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="map-view-container"
            >
              <MapComponent places={filteredPlaces} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!loading && filteredPlaces.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MapPin style={{ width: '6rem', height: '6rem' }} />
          </div>
          <h2 className="empty-state-title">No hay lugares aquí todavía</h2>
          <p className="empty-state-text">Prueba ajustando los filtros o vuelve pronto para ver nuevas actualizaciones.</p>
        </div>
      )}

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}

