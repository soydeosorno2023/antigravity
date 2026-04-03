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
    <div className="pb-24 max-w-7xl mx-auto min-h-screen flex flex-col">
      <SEO 
        title={category?.name || 'Explorar'}
        description={`Descubre los mejores lugares en la categoría ${category?.name || slug} en Osorno, Chile. Encuentra direcciones, fotos y más.`}
        canonical={`/categoria/${slug}`}
      />
      <div className="px-6 pt-6">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors flex-shrink-0">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 truncate">
                {loading ? <div className="h-8 w-32 skeleton rounded-lg" /> : (category?.name || 'Explorar')}
              </h1>
              <div className="text-gray-500 text-xs md:text-sm">
                {loading ? <div className="h-4 w-24 skeleton rounded-lg mt-1" /> : `${filteredPlaces.length} lugares encontrados`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsSubcategoryOpen(false);
                }}
                className={`w-full flex items-center justify-center gap-2 h-11 px-2 rounded-2xl text-[10px] sm:text-xs font-bold transition-all border ${
                  activeFiltersCount > 0 
                    ? 'bg-sky-50 border-sky-200 text-sky-600' 
                    : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                <Filter className="w-3.5 h-3.5 sm:w-4 h-4 flex-shrink-0" />
                <span className="truncate">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-sky-600 text-white w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] flex-shrink-0">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsFilterOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden origin-top-left"
                    >
                      <div className="p-2">
                        <button
                          onClick={() => toggleFilter('petFriendly')}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${filters.petFriendly ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500'}`}>
                              <Dog className="w-4 h-4" />
                            </div>
                            <span className={`text-sm font-bold ${filters.petFriendly ? 'text-sky-600' : 'text-gray-700 dark:text-gray-300'}`}>Mascotas</span>
                          </div>
                          {filters.petFriendly && <Check className="w-4 h-4 text-sky-600" />}
                        </button>

                        <button
                          onClick={() => toggleFilter('parking')}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${filters.parking ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500'}`}>
                              <ParkingCircle className="w-4 h-4" />
                            </div>
                            <span className={`text-sm font-bold ${filters.parking ? 'text-sky-600' : 'text-gray-700 dark:text-gray-300'}`}>Estacionamiento</span>
                          </div>
                          {filters.parking && <Check className="w-4 h-4 text-sky-600" />}
                        </button>

                        <button
                          onClick={() => toggleFilter('wifi')}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${filters.wifi ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500'}`}>
                              <Wifi className="w-4 h-4" />
                            </div>
                            <span className={`text-sm font-bold ${filters.wifi ? 'text-sky-600' : 'text-gray-700 dark:text-gray-300'}`}>Wi-Fi</span>
                          </div>
                          {filters.wifi && <Check className="w-4 h-4 text-sky-600" />}
                        </button>
                      </div>
                      
                      {activeFiltersCount > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <button
                            onClick={() => setFilters({ petFriendly: false, parking: false, wifi: false })}
                            className="w-full py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
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

            {/* Subcategories Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsSubcategoryOpen(!isSubcategoryOpen);
                  setIsFilterOpen(false);
                }}
                disabled={subcategories.length === 0}
                className={`w-full flex items-center justify-center gap-2 h-11 px-2 rounded-2xl text-[10px] sm:text-xs font-bold transition-all border ${
                  selectedSubcategoryId 
                    ? 'bg-sky-50 border-sky-200 text-sky-600' 
                    : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                } ${subcategories.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Tag className="w-3.5 h-3.5 sm:w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {selectedSubcategoryId 
                    ? subcategories.find(s => s.id === selectedSubcategoryId)?.name 
                    : 'Tipos'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isSubcategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isSubcategoryOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSubcategoryOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden origin-top"
                    >
                      <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <button
                          onClick={() => {
                            setSelectedSubcategoryId(null);
                            setIsSubcategoryOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${
                            !selectedSubcategoryId ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="text-sm font-bold">Todas</span>
                          {!selectedSubcategoryId && <Check className="w-4 h-4 text-sky-600" />}
                        </button>

                        {subcategories.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setSelectedSubcategoryId(sub.id);
                              setIsSubcategoryOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${
                              selectedSubcategoryId === sub.id ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span className="text-sm font-bold">{sub.name}</span>
                            {selectedSubcategoryId === sub.id && <Check className="w-4 h-4 text-sky-600" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="w-full flex items-center justify-center gap-2 h-11 px-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-transparent"
            >
              {viewMode === 'list' ? (
                <>
                  <MapIcon className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span>Mapa</span>
                </>
              ) : (
                <>
                  <ListIcon className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span>Lista</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow px-6">
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              variants={containerVariants}
              className="flex flex-col gap-4"
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
              className="aspect-square md:aspect-auto md:h-[calc(100vh-380px)] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative"
            >
              <MapComponent places={filteredPlaces} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!loading && filteredPlaces.length === 0 && (
        <div className="text-center py-20 px-6">
          <div className="text-gray-200 mb-6">
            <MapPin className="w-24 h-24 mx-auto" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">No hay lugares aquí todavía</h2>
          <p className="text-gray-500 max-w-xs mx-auto">Prueba ajustando los filtros o vuelve pronto para ver nuevas actualizaciones.</p>
        </div>
      )}

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}

