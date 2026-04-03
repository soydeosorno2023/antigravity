import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Instagram, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '../types';
import { api } from '../services/api';
import { optimizeImageUrl } from '../utils/image';
import { ElegantImage } from './ElegantImage';

interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

interface InstagramFeedProps {
  accessToken: string;
  userId: string;
  place?: Place;
}

export function InstagramFeed({ accessToken, userId, place }: InstagramFeedProps) {
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<InstagramMedia | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      const cacheKey = `cached_ig_feed_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // Cache valid for 1 hour
          if (data && Date.now() - timestamp < 3600000) {
            setMedia(data);
            setLoading(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      try {
        setLoading(true);
        const data = await api.getInstagramMedia(userId, accessToken, 4);
        const mediaData = data || [];
        setMedia(mediaData);
        
        // Cache the result
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: mediaData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error caching Instagram media:', e);
        }
      } catch (err: any) {
        console.error('Error fetching Instagram media:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchMedia();
    }
  }, [accessToken, userId]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#F5B027]" />
        <p className="text-sm font-medium uppercase tracking-wider">Cargando Instagram...</p>
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (media.length === 0) {
    return null;
  }

  const displayedMedia = media;

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
            {/* Floating Close Button */}
            <button 
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 bg-white/90 dark:bg-black/50 hover:bg-white dark:hover:bg-black rounded-full text-gray-900 dark:text-white transition-all z-[60] shadow-xl backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50"
              onClick={() => setSelectedMedia(null)}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mobile Layout */}
            <div className="md:hidden flex flex-col w-full h-full overflow-hidden">
              {/* Sticky Header */}
              <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-40">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <ElegantImage 
                    src={optimizeImageUrl(place?.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${place?.name}`, 80)} 
                    alt={place?.name || 'Instagram'} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 pr-12">
                  <p className="font-black text-sm text-gray-900 dark:text-white truncate">{place?.name || 'Instagram'}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                    {new Date(selectedMedia.timestamp).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Media */}
                <div className="w-full bg-gray-100 dark:bg-black flex items-center justify-center">
                  {selectedMedia.media_type === 'VIDEO' ? (
                    <video 
                      src={selectedMedia.media_url} 
                      controls 
                      autoPlay 
                      className="w-full h-auto block"
                    />
                  ) : (
                    <ElegantImage 
                      src={selectedMedia.media_url} 
                      alt={selectedMedia.caption} 
                      className="w-full h-auto block"
                      containerClassName="w-full"
                      sizes="100vw"
                    />
                  )}
                </div>

                {/* Caption */}
                <div className="p-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedMedia.caption}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex flex-row w-full h-full min-h-[600px]">
              {/* Media Section */}
              <div className="flex-1 bg-gray-100 dark:bg-black relative flex items-center justify-center overflow-hidden">
                {/* Blurred background */}
                <ElegantImage 
                  src={selectedMedia.media_type === 'VIDEO' ? selectedMedia.thumbnail_url : selectedMedia.media_url} 
                  className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-125"
                  alt="background blur"
                  containerClassName="absolute inset-0"
                  sizes="100vw"
                />
                
                {selectedMedia.media_type === 'VIDEO' ? (
                  <video 
                    src={selectedMedia.media_url} 
                    controls 
                    autoPlay 
                    className="relative z-10 max-w-full max-h-full shadow-2xl"
                  />
                ) : (
                  <ElegantImage 
                    src={selectedMedia.media_url} 
                    alt={selectedMedia.caption} 
                    className="relative z-10 max-w-full max-h-full object-contain shadow-2xl"
                    containerClassName="relative z-10 max-w-full max-h-full"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                )}
              </div>

              {/* Info Section */}
              <div className="w-[400px] p-8 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 mb-8 pr-12">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#F5B027]/20 flex-shrink-0 shadow-inner">
                    <ElegantImage 
                      src={optimizeImageUrl(place?.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${place?.name}`, 80)} 
                      alt={place?.name || 'Instagram'} 
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-lg text-gray-900 dark:text-white truncate leading-tight">{place?.name || 'Instagram'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      {new Date(selectedMedia.timestamp).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar mb-8 min-h-[100px]">
                  <p className="text-[15px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                    {selectedMedia.caption}
                  </p>
                </div>

                <div className="mt-auto">
                  <a 
                    href={selectedMedia.permalink}
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
    <div className="space-y-6 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#F5B027]/10 rounded-xl text-[#F5B027]">
            <Instagram className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Novedades</h3>
        </div>
      </div>

      <div className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto pb-4 -mb-4 lg:pb-0 lg:mb-0 no-scrollbar">
        {displayedMedia.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            transition={{ delay: idx * 0.05 }}
            viewport={{ once: true }}
            onClick={() => setSelectedMedia(item)}
            className="group relative flex-shrink-0 w-[45vw] lg:w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm cursor-pointer"
          >
            <ElegantImage 
              src={item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url} 
              alt={item.caption || 'Instagram post'} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              containerClassName="w-full h-full"
              sizes="(max-width: 768px) 45vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30">
                <Instagram className="text-white w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="h-8" /> 

      {createPortal(modalContent, document.body)}
    </div>
  );
}
