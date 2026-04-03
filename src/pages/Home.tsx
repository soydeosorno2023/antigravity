import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search, Mic, Palmtree, Map as MapIcon, Hotel, Utensils, ChevronRight, Globe, Heart, Laptop, MapPin, Bell, SlidersHorizontal, User, Sun, Moon, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Category, Place, Commune } from '../types';
import { CategorySkeleton, FeaturedCardSkeleton } from '../components/Skeleton';
import { useLocation } from '../context/LocationContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { calculateDistance } from '../utils/distance';
import { optimizeImageUrl } from '../utils/image';
import { ElegantImage } from '../components/ElegantImage';
import { LoginModal } from '../components/LoginModal';
import { WeatherWidget } from '../components/WeatherWidget';
import { HomeViewHistory } from '../components/HomeViewHistory';
import { SEO } from '../components/SEO';
import { lazyWithRetry } from '../utils/lazy';
const HomeInstagramFeed = lazyWithRetry(() => import('../components/HomeInstagramFeed').then(m => ({ default: m.HomeInstagramFeed })));

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
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

export function Home() {
  const { 
    categories, 
    featured, 
    appSettings, 
    communes, 
    loading: dataLoading,
  } = useData();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { location, loading: locationLoading } = useLocation();
  const { isLoginModalOpen, setIsLoginModalOpen } = useFavorites();
  const [currentCommune, setCurrentCommune] = useState<{ name: string, image: string }>(() => {
    // Try to find Osorno in communes if available, otherwise use default
    return {
      name: 'Osorno',
      image: 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0174676596.firebasestorage.app/o/images%2F1773589808925_481976720_559983523757257_4006716616786799264_n.jpg?alt=media&token=88d685ec-d696-4a21-bf69-2b9117cb3d1b'
    };
  });

  useEffect(() => {
    if (location) {
      const DEFAULT_COMMUNES = [
        {
          name: 'Osorno',
          lat: -40.5739,
          lng: -73.1331,
          image_url: 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0174676596.firebasestorage.app/o/images%2F1773589808925_481976720_559983523757257_4006716616786799264_n.jpg?alt=media&token=88d685ec-d696-4a21-bf69-2b9117cb3d1b'
        },
        {
          name: 'Puyehue',
          lat: -40.6833,
          lng: -72.6,
          image_url: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849'
        },
        {
          name: 'Purranque',
          lat: -40.9167,
          lng: -73.1667,
          image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef'
        },
        {
          name: 'Puerto Octay',
          lat: -40.9667,
          lng: -72.8833,
          image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'
        },
        {
          name: 'Río Negro',
          lat: -40.7833,
          lng: -73.2167,
          image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e'
        },
        {
          name: 'San Juan de la Costa',
          lat: -40.5167,
          lng: -73.6667,
          image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'
        },
        {
          name: 'San Pablo',
          lat: -40.4,
          lng: -73.0167,
          image_url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8'
        }
      ];

      const availableCommunes = communes.length > 0 ? communes : DEFAULT_COMMUNES;

      let closest = availableCommunes[0];
      let minDistance = Infinity;

      availableCommunes.forEach(commune => {
        const dist = calculateDistance(location.lat, location.lng, commune.lat, commune.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closest = commune;
        }
      });

      const newCommune = { name: closest.name, image: closest.image_url };
      setCurrentCommune(prev => {
        if (prev.name === newCommune.name && prev.image === newCommune.image) return prev;
        return newCommune;
      });
    }
  }, [location, communes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use dataLoading directly from useData

  const sortedFeatured = useMemo(() => {
    if (!location || featured.length === 0) return featured;

    return [...featured].sort((a, b) => {
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
  }, [featured, location]);

  useEffect(() => {
    if (search.trim().length > 1) {
      const timer = setTimeout(async () => {
        try {
          const results = await api.searchPlaces(search);
          
          // Sort results by distance if location is available
          const sortedResults = location ? [...results].sort((a, b) => {
            const latA = a.lat || 0;
            const lngA = a.lng || 0;
            const latB = b.lat || 0;
            const lngB = b.lng || 0;

            if (latA === 0 || lngA === 0) return 1;
            if (latB === 0 || lngB === 0) return -1;

            const distA = calculateDistance(location.lat, location.lng, latA, lngA);
            const distB = calculateDistance(location.lat, location.lng, latB, lngB);
            return distA - distB;
          }) : results;

          setSearchResults(sortedResults);
          setShowResults(true);
        } catch (err) {
          console.error("Search error:", err);
          setSearchResults([]);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [search, location]);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
    };

    recognition.start();
  };

  return (
    <motion.div 
      className="pb-24"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <SEO 
        title="Inicio"
        description="Explora Osorno, Chile. Encuentra los mejores destinos, hoteles, restaurantes y comercios locales en nuestra guía interactiva."
        keywords="Osorno, turismo, guía local, Chile, destinos, panoramas"
      />

      {/* New Hero Section - Geolocation Based Background */}
      <section className="relative pt-8 pb-10 px-6 overflow-hidden min-h-[320px] flex items-center bg-gray-100 dark:bg-gray-900">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <ElegantImage 
            src={optimizeImageUrl(currentCommune.image, window.innerWidth < 768 ? 800 : 1200)} 
            alt={currentCommune.name} 
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            skeletonClassName="bg-gray-100 dark:bg-gray-900"
            priority={true}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#F8F9FB] dark:to-gray-950 transition-colors duration-300" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 w-full">
          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <WeatherWidget />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-8 max-w-xs md:max-w-xl drop-shadow-lg">
              Explora en {currentCommune.name} los mejores lugares cerca de ti
            </h1>
          </motion.div>

          {/* Search Bar & Filter */}
          <div className="flex items-center gap-3 mb-8 search-container">
            <div className="flex-1 relative">
              <div className="flex items-center bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-[#F5B027]/20 transition-all">
                <div className="pl-4">
                  <Search className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar destino..."
                  className="w-full py-4 px-3 text-base text-gray-700 dark:text-gray-200 bg-transparent focus:outline-none placeholder-gray-400 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => search.trim().length > 1 && setShowResults(true)}
                />
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                  >
                    {searchResults.length > 0 ? (
                      searchResults.map((place) => (
                        <Link
                          key={place.id}
                          to={`/lugar/${place.slug || place.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                          onClick={() => setShowResults(false)}
                        >
                          <ElegantImage
                            src={optimizeImageUrl(place.profile_image_url, 100)}
                            alt={place.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            containerClassName="w-12 h-12"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {place.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="bg-[#F5B027]/10 text-[#F5B027] px-2 py-0.5 rounded text-xs font-medium">
                                {place.category_name}
                              </span>
                              <span className="truncate">{place.address}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </Link>
                      ))
                    ) : search.trim().length > 1 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron resultados para "{search}"</p>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="w-14 h-14 rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/20 dark:border-gray-700 text-gray-700 dark:text-gray-200">
              <SlidersHorizontal className="w-6 h-6" />
            </button>
          </div>

          {/* Categories Section - Pill Style */}
          <div className="flex items-center overflow-x-auto gap-2.5 no-scrollbar -mx-6 px-6 py-2">
            {dataLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse flex-shrink-0" />
              ))
            ) : (
              [...categories].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((cat) => (
                <Link key={cat.id} to={`/categoria/${cat.slug}`} className="flex-shrink-0">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all bg-white/95 dark:bg-gray-800/95 backdrop-blur-md text-[#0D4744] dark:text-gray-200 border border-white/20 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0D4744]/5 dark:bg-gray-700">
                      {cat.slug === 'hoteles' ? <Hotel className="w-6 h-6" /> : 
                       cat.slug === 'restaurantes' ? <Utensils className="w-6 h-6" /> :
                       cat.slug === 'destinos' ? <Palmtree className="w-6 h-6" /> :
                       <MapIcon className="w-6 h-6" />}
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap uppercase tracking-wider">{cat.name}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* Featured Listings Section */}
      <motion.section variants={itemVariants} className="px-6 py-6 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Destacados</h2>
            <Link to="/explorar" className="text-sm font-medium text-gray-500 hover:text-[#F5B027] transition-colors">
              Ver todos
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 py-4 no-scrollbar -mx-6 px-6">
            {dataLoading ? (
              [1, 2, 3].map((i) => <FeaturedCardSkeleton key={i} />)
            ) : (
              <>
                {sortedFeatured.map(place => {
                  const distance = location ? calculateDistance(location.lat, location.lng, place.lat || 0, place.lng || 0) : null;
                  return (
                    <div key={place.id} className="flex-shrink-0 w-[75%] sm:w-[320px]">
                      <FeaturedCard 
                        id={place.id}
                        slug={place.slug}
                        title={place.name}
                        coverImage={place.cover_image_url}
                        profileImage={place.profile_image_url}
                        distance={distance ? `${distance.toFixed(1)} km` : undefined}
                        favoritesCount={place.favorites_count}
                      />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* Instagram Feed Section */}
      <motion.div variants={itemVariants}>
        <Suspense fallback={<div className="h-20 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#F5B027]" /></div>}>
          <HomeInstagramFeed />
        </Suspense>
      </motion.div>

      {/* View History Section */}
      <motion.div variants={itemVariants}>
        <HomeViewHistory />
      </motion.div>

      {/* Action Banners - Replaced with Weather Section above, but keeping a smaller version if needed or removing as requested */}
      {/* Removing as requested to replace with weather widget */}

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </motion.div>
  );
}

function FeaturedCard({ id, slug, title, coverImage, profileImage, distance, favoritesCount }: { id: string, slug: string, title: string, coverImage: string, profileImage?: string, distance?: string, favoritesCount?: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <Link 
      to={`/lugar/${slug || id}`}
      className="relative h-48 rounded-2xl overflow-hidden shadow-md group block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ElegantImage 
        src={optimizeImageUrl(coverImage, 600)} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-100"
        containerClassName="w-full h-full"
        sizes="(max-width: 768px) 75vw, 320px"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />
      
      {distance && (
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-white z-20">
          <MapPin className="w-3 h-3" />
          <span className="text-[10px] font-bold">{distance}</span>
        </div>
      )}

      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(id);
        }}
        className="absolute top-3 left-3 h-10 px-3 bg-black/20 backdrop-blur-md rounded-full flex items-center gap-2 text-white hover:bg-black/40 transition-all z-20"
      >
        <Heart className={`w-5 h-5 ${isFavorite(id) ? 'fill-red-500 text-red-500' : ''}`} />
        {favoritesCount !== undefined && favoritesCount > 0 && (
          <span className="text-xs font-bold">{favoritesCount}</span>
        )}
      </button>

      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 z-20">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex-shrink-0 shadow-md bg-white">
          <ElegantImage 
            src={optimizeImageUrl(profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${title}`, 80)} 
            alt={title} 
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
          />
        </div>
        <div className="text-white min-w-0">
          <h3 className="font-bold text-base leading-tight truncate">{title}</h3>
        </div>
      </div>
    </Link>
  );
}
