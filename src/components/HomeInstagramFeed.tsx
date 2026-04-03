import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Instagram, Loader2, X, User } from 'lucide-react';
import { api } from '../services/api';
import { Place } from '../types';
import { optimizeImageUrl } from '../utils/image';
import { ElegantImage } from './ElegantImage';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../context/FavoritesContext';

interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

interface PlaceWithLatestMedia extends Place {
  latestMedia: InstagramMedia;
}

export function HomeInstagramFeed() {
  const [placesWithMedia, setPlacesWithMedia] = useState<PlaceWithLatestMedia[]>(() => {
    const cached = localStorage.getItem('cached_instagram_feed');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 1 hour AND must have data
        if (data && data.length > 0 && Date.now() - timestamp < 3600000) {
          return data;
        }
      } catch (e) {
        localStorage.removeItem('cached_instagram_feed');
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = localStorage.getItem('cached_instagram_feed');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // If we have data and it's fresh, don't show loading
        if (data && data.length > 0 && Date.now() - timestamp < 3600000) {
          return false;
        }
      } catch (e) {}
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const { favorites, user, setIsLoginModalOpen } = useFavorites();
  const [selectedMedia, setSelectedMedia] = useState<{ media: InstagramMedia, place: Place } | null>(null);

  useEffect(() => {
    const fetchAllMedia = async () => {
      // If we have fresh cache with data, don't fetch
      const cached = localStorage.getItem('cached_instagram_feed');
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (data && data.length > 0 && Date.now() - timestamp < 3600000) {
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch places with Instagram
        const places = await api.getPlaces({ hasInstagram: true });
        
        if (places.length === 0) {
          setLoading(false);
          return;
        }

        // Process up to 6 places to ensure we find some valid media
        const igPlaces = places.slice(0, 6);

        // Fetch latest post for each place in parallel
        const mediaPromises = igPlaces.map(async (place) => {
          try {
            if (!place.instagram_user_id || !place.instagram_access_token) {
              return null;
            }
            
            const mediaData = await api.getInstagramMedia(
              place.instagram_user_id, 
              place.instagram_access_token, 
              1
            );
            
            if (mediaData && mediaData.length > 0) {
              return { ...place, latestMedia: mediaData[0] } as PlaceWithLatestMedia;
            }
            return null;
          } catch (err: any) {
            // Log individual errors but don't fail the whole feed
            console.warn(`Failed to fetch IG media for ${place.name}:`, err.message);
            return null;
          }
        });

        const results = await Promise.all(mediaPromises);
        const validResults = results.filter((r): r is PlaceWithLatestMedia => r !== null);
        
        if (validResults.length > 0) {
          // Sort by timestamp (newest first)
          validResults.sort((a, b) => {
            const timeA = new Date(a.latestMedia?.timestamp || 0).getTime();
            const timeB = new Date(b.latestMedia?.timestamp || 0).getTime();
            return timeB - timeA;
          });

          setPlacesWithMedia(validResults);
          try {
            localStorage.setItem('cached_instagram_feed', JSON.stringify({
              data: validResults,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error('Error caching HomeInstagramFeed media:', e);
          }
        } else {
          // If no valid results, don't cache an empty state
          setPlacesWithMedia([]);
        }
      } catch (err) {
        console.error('Error in HomeInstagramFeed:', err);
        // Only show error if we don't have cached data to show
        if (placesWithMedia.length === 0) {
          setError('No se pudieron cargar las novedades de Instagram');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllMedia();
  }, []);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (selectedMedia) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedMedia]);

  // Filter places based on favorites
  const favoritePlacesWithMedia = placesWithMedia.filter(p => favorites.includes(p.id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#F5B027]" />
        <p className="text-xs font-bold tracking-widest uppercase opacity-60">Descubriendo novedades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  if (favoritePlacesWithMedia.length === 0) {
    return (
      <section className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-baseline gap-2 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Novedades</h2>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300 mb-4">Aún no tienes locales favoritos.</p>
            <Link to="/explorar" className="inline-block px-6 py-3 bg-[#F5B027] text-black font-bold rounded-xl hover:bg-[#e5a017] transition-colors">
              Explorar locales
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const displayedPlaces = favoritePlacesWithMedia.slice(0, 4);


  const modalContent = (
    <AnimatePresence>
      {selectedMedia && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl pointer-events-auto"
          onClick={() => setSelectedMedia(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative max-w-5xl w-full bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Close Button - Fixed on top right of modal */}
            <button 
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 bg-white/90 dark:bg-black/50 hover:bg-white dark:hover:bg-black rounded-full text-gray-900 dark:text-white transition-all z-[60] shadow-xl backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50"
              onClick={() => setSelectedMedia(null)}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mobile Layout (Header above image) */}
            <div className="md:hidden flex flex-col w-full h-full overflow-hidden">
              {/* Sticky Header */}
              <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-40">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <ElegantImage 
                    src={optimizeImageUrl(selectedMedia.place.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedMedia.place.name}`, 80)} 
                    alt={selectedMedia.place.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 pr-12">
                  <p className="font-black text-sm text-gray-900 dark:text-white truncate">{selectedMedia.place.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                    {new Date(selectedMedia.media.timestamp).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {/* Image/Video */}
                <div className="w-full bg-gray-100 dark:bg-black flex items-center justify-center">
                  {selectedMedia.media.media_type === 'VIDEO' ? (
                    <video 
                      src={selectedMedia.media.media_url} 
                      controls 
                      autoPlay 
                      className="w-full h-auto block"
                    />
                  ) : (
                    <ElegantImage 
                      src={selectedMedia.media.media_url} 
                      alt={selectedMedia.media.caption} 
                      className="w-full h-auto block"
                      containerClassName="w-full"
                    />
                  )}
                </div>

                {/* Caption */}
                <div className="p-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedMedia.media.caption}
                  </p>
                </div>
              </div>

              {/* Floating Footer Button - Mobile */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-gray-900 via-white/80 dark:via-gray-900/80 to-transparent z-50">
                <Link
                  to={`/lugar/${selectedMedia.place.slug}`}
                  className="w-full py-4 bg-[#F5B027] hover:bg-[#e5a017] text-black rounded-2xl font-black text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-[#F5B027]/20 transition-all active:scale-[0.98]"
                  onClick={() => setSelectedMedia(null)}
                >
                  <User className="w-4 h-4" />
                  Ver perfil del local
                </Link>
              </div>
            </div>

            {/* Desktop Layout (Side by Side) */}
            <div className="hidden md:flex flex-row w-full h-full min-h-[600px]">
              {/* Media Section */}
              <div className="flex-1 bg-gray-100 dark:bg-black relative flex items-center justify-center overflow-hidden">
                {/* Blurred background */}
                <ElegantImage 
                  src={selectedMedia.media.media_type === 'VIDEO' ? selectedMedia.media.thumbnail_url : selectedMedia.media.media_url} 
                  className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-125"
                  alt="background blur"
                  containerClassName="absolute inset-0"
                  sizes="100vw"
                />
                
                {selectedMedia.media.media_type === 'VIDEO' ? (
                  <video 
                    src={selectedMedia.media.media_url} 
                    controls 
                    autoPlay 
                    className="relative z-10 max-w-full max-h-full shadow-2xl"
                  />
                ) : (
                  <ElegantImage 
                    src={selectedMedia.media.media_url} 
                    alt={selectedMedia.media.caption} 
                    className="relative z-10 max-w-full max-h-full object-contain shadow-2xl"
                    containerClassName="relative z-10 max-w-full max-h-full"
                  />
                )}
              </div>

              {/* Info Section */}
              <div className="w-[400px] p-8 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 mb-8 pr-12">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#F5B027]/20 flex-shrink-0 shadow-inner">
                    <ElegantImage 
                      src={optimizeImageUrl(selectedMedia.place.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedMedia.place.name}`, 80)} 
                      alt={selectedMedia.place.name} 
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-lg text-gray-900 dark:text-white truncate leading-tight">{selectedMedia.place.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      {new Date(selectedMedia.media.timestamp).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar mb-8 min-h-[100px]">
                  <p className="text-[15px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                    {selectedMedia.media.caption}
                  </p>
                </div>

                <div className="space-y-4 mt-auto">
                  <Link
                    to={`/lugar/${selectedMedia.place.slug}`}
                    className="w-full py-4 bg-[#F5B027] hover:bg-[#e5a017] text-black rounded-2xl font-black text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-[#F5B027]/20 transition-all active:scale-[0.98]"
                    onClick={() => setSelectedMedia(null)}
                  >
                    <User className="w-4 h-4" />
                    Ver perfil completo
                  </Link>
                  
                  <a 
                    href={selectedMedia.media.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black text-sm text-center flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    <Instagram className="w-4 h-4" />
                    Ver en Instagram
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section className="px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Novedades</h2>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">Últimos posts de locales</span>
          <div className="h-[1px] bg-gray-200 w-full" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedPlaces.map((place, idx) => (
            <motion.div 
              key={place.id} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              onClick={() => setSelectedMedia({ media: place.latestMedia, place })}
              className={`relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg group cursor-pointer ${idx >= 2 ? 'hidden lg:block' : ''}`}
            >
              <ElegantImage 
                src={place.latestMedia?.media_type === 'VIDEO' ? place.latestMedia?.thumbnail_url : place.latestMedia?.media_url} 
                alt={place.latestMedia?.caption || place.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                containerClassName="w-full h-full"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              
              {/* Place Info Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50 flex-shrink-0 shadow-md bg-white">
                  <ElegantImage 
                    src={optimizeImageUrl(place.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${place.name}`, 80)} 
                    alt={place.name} 
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                </div>
                <div className="text-white min-w-0">
                  <h3 className="font-bold text-sm leading-tight truncate drop-shadow-md">{place.name}</h3>
                  <div className="flex items-center gap-1 opacity-90">
                    <Instagram className="w-3 h-3" />
                    <span className="text-[10px] font-medium truncate">@{place.instagram_username || 'instagram'}</span>
                  </div>
                </div>
              </div>

              {/* Media Type Icon */}
              <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0">
                <Instagram className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {createPortal(modalContent, document.body)}
    </section>
  );
}
