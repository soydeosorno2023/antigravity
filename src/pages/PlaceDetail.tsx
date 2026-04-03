import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Phone, Globe, Clock, ChevronLeft, Share2, Heart, 
  MessageCircle, Play, CheckCircle2, Star, ChevronRight, Video, Image, Utensils,
  MoreHorizontal, Info, Calendar, MessageSquare, Navigation, X, Edit2, Sun, Moon, User
} from 'lucide-react';
import { api } from '../services/api';
import { Place, Tour, Review, Category } from '../types';
import { useLocation } from '../context/LocationContext';
import { useFavorites } from '../context/FavoritesContext';
import { calculateDistance } from '../utils/distance';
import { getYoutubeVideoId } from '../utils/youtube';
import { optimizeImageUrl } from '../utils/image';
import { Skeleton } from '../components/Skeleton';
import { MapComponent } from '../components/MapComponent';
import { ElegantImage } from '../components/ElegantImage';
import { LoginModal } from '../components/LoginModal';
import { InstagramFeed } from '../components/InstagramFeed';
import { MenuSection } from '../components/MenuSection';

import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

export function PlaceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAdmin } = useAuth();
  const [place, setPlace] = useState<Place | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Información');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isFavorite, toggleFavorite, isLoginModalOpen, setIsLoginModalOpen } = useFavorites();
  const { location: userLocation } = useLocation();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) {
      setLoading(true);
      
      let unsubPlace: (() => void) | undefined;
      let unsubOthers: (() => void) | undefined;

      // Attempt to fetch by slug first
      Promise.all([
        api.getPlaceBySlug(slug).catch(() => api.getPlace(slug as string)),
        api.getCategories()
      ])
        .then(([placeData, cats]) => {
          setPlace(placeData);
          setCategories(cats);
          unsubOthers = setupSubscriptions(placeData.id);
          
          // Subscribe to real-time updates for this place (for favorites count)
          unsubPlace = api.subscribeToPlace(placeData.id, (updatedPlace) => {
            setPlace(updatedPlace);
          });
        })
        .catch(err => {
          console.error("Error fetching place or categories:", err);
          setPlace(null);
        })
        .finally(() => setLoading(false));

      return () => {
        if (unsubPlace) unsubPlace();
        if (unsubOthers) unsubOthers();
      };
    }
  }, [slug]);

  useEffect(() => {
    const hash = decodeURIComponent(routerLocation.hash);
    const categoryName = place?.category_name || categories.find(c => c.id === place?.category_id)?.name;
    const category = categoryName?.trim().toLowerCase();
    
    if (hash === '#menu' && place?.has_menu) setActiveTab('Menú');
    else if (hash === '#reseñas') setActiveTab('Reseñas');
    else if (hash === '#galeria') setActiveTab('Galería');
    else if (hash === '#tours' && category === 'parques') setActiveTab('Tours');
    else if (hash === '#info' || hash === '') setActiveTab('Información');
  }, [routerLocation.hash, place, categories]);

  useEffect(() => {
    const categoryName = place?.category_name || categories.find(c => c.id === place?.category_id)?.name;
    const category = categoryName?.trim().toLowerCase();
    if (category === 'parques' && activeTab === 'Menú') {
      setActiveTab('Tours');
    }
  }, [place, activeTab, categories]);

  const handleSubmitReview = async () => {
    if (!place || !user) return;
    try {
      if (editingReview) {
        await api.updateReview('', editingReview.id, {
          comment: editingReview.comment,
          rating: editingReview.rating
        });
        setEditingReview(null);
      } else {
        await api.createReview('', place.id, {
          place_id: place.id,
          user_name: user.full_name,
          user_avatar: user.avatar_url,
          rating: newReviewRating,
          comment: newReviewComment
        });
        setNewReviewComment('');
        setNewReviewRating(5);
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar la reseña');
    }
  };

  const setupSubscriptions = (placeId: string) => {
    const unsubTours = api.subscribeToTours(placeId, (toursData) => {
      setTours(toursData);
    });

    const unsubReviews = api.subscribeToReviews(placeId, (reviewsData) => {
      setReviews(reviewsData);
    });

    const unsubMenu = api.subscribeToMenuItems(placeId, (menuData) => {
      setMenuItems(menuData);
    });

    return () => {
      unsubTours();
      unsubReviews();
      unsubMenu();
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
        <div className="h-64 md:h-96 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="max-w-7xl mx-auto px-6 -mt-12 w-full">
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800">
            <Skeleton className="h-10 w-2/3 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Lugar no encontrado</h1>
        <Link to="/" className="text-sky-500 font-medium">Volver al inicio</Link>
      </div>
    );
  }

  let gallery = [];
  try {
    gallery = typeof place.gallery === 'string' ? JSON.parse(place.gallery || '[]') : (Array.isArray(place.gallery) ? place.gallery : []);
  } catch (e) {
    console.error("Error parsing gallery:", e);
    gallery = [];
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const roundedRating = Math.round(Number(averageRating));

  const hasUserReviewed = user ? reviews.some(r => r.user_id === user.id) : false;

  const tabs = ['Inicio', 'Información', 'Menú', 'Reseñas', 'Galería', 'Tours'];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-32 transition-colors duration-300">
      <SEO 
        title={place.name}
        description={place.full_description}
        ogImage={place.cover_image_url || place.profile_image_url}
        canonical={`/lugar/${place.slug}`}
        ogType="article"
        schema={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": place.name,
          "description": place.full_description,
          "image": place.cover_image_url || place.profile_image_url,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": place.address,
            "addressLocality": "Osorno",
            "addressRegion": "Los Lagos",
            "addressCountry": "CL"
          },
          "telephone": place.phone,
          "url": `https://miraosorno.cl/lugar/${place.slug}`,
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": place.lat,
            "longitude": place.lng
          }
        }}
      />

      {/* Hero Section */}
      <div className="relative h-[45vh] md:h-[60vh] overflow-hidden bg-black">
        {place.youtube_video_url && getYoutubeVideoId(place.youtube_video_url) ? (
          !isVideoModalOpen && (
            <iframe
              src={`https://www.youtube.com/embed/${getYoutubeVideoId(place.youtube_video_url)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${getYoutubeVideoId(place.youtube_video_url)}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1&playsinline=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="absolute top-1/2 left-1/2 w-[400%] h-[400%] max-w-none -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            />
          )
        ) : (
          <ElegantImage
            src={optimizeImageUrl(place.cover_image_url || `https://picsum.photos/seed/${place.id}/1200/800`, 1200)}
            alt={place.name}
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            priority={true}
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />
        
        {/* Top Controls */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {(isAdmin || (user && place && place.owner_id === user.id)) && (
              <Link
                to={`/admin?edit=${place.id}`}
                className="h-10 px-4 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-2 text-white hover:bg-white/40 transition-all font-bold"
              >
                <Edit2 className="w-5 h-5" />
                <span className="hidden sm:inline">Editar</span>
              </Link>
            )}
            <button 
              onClick={() => toggleFavorite(place.id)}
              className="h-10 px-4 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-2 text-white hover:bg-white/40 transition-all"
            >
              <Heart className={`w-5 h-5 ${isFavorite(place.id) ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-sm font-bold drop-shadow-md">
                {place.favorites_count?.toLocaleString() || '0'}
              </span>
            </button>
          </div>
        </div>

        {/* Play Button Overlay */}
        {place.youtube_video_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={() => {
                setIsVideoModalOpen(true);
                if (iframeRef.current && iframeRef.current.contentWindow) {
                  iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }
              }}
              className="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
            >
              <Play className="w-10 h-10 fill-white ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Profile Info Card */}
      <div className="px-6 -mt-12 relative z-10">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-2xl shadow-gray-200 dark:shadow-none border border-gray-50 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-md flex-shrink-0">
                <ElegantImage 
                  src={optimizeImageUrl(place.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${place.name}`, 160)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1.5">
                  <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight break-words">{place.name}</h1>
                  <CheckCircle2 className="w-5 h-5 text-sky-500 fill-sky-500/10 flex-shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center flex-wrap gap-1 mt-0.5">
                  <div className="flex text-orange-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < roundedRating ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white ml-1">{averageRating}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate">|({reviews.length} opiniones)</span>
                </div>
              </div>
            </div>
            <a 
              href={place.whatsapp ? `https://wa.me/${place.whatsapp}` : `tel:${place.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#22c55e] text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#16a34a] transition-all shadow-lg shadow-green-100 dark:shadow-none w-full sm:w-auto"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar
            </a>
          </div>

          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full sm:w-fit px-4 py-2 rounded-full cursor-pointer group overflow-hidden"
          >
            <div className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center text-white flex-shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate flex-1">{place.address}</span>
            {userLocation && place.lat && place.lng && (
              <span className="text-xs font-bold text-sky-500 dark:text-sky-400 ml-1 flex-shrink-0">
                ({calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng) < 1 
                  ? `${(calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng) * 1000).toFixed(0)} m` 
                  : `${calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng).toFixed(1)} km`})
              </span>
            )}
            <Navigation className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-gray-100 dark:border-gray-800">
      </div>

      {/* Tab Content */}
      <div className="px-6 py-8">
        {/* Instagram Feed - Always mounted, hidden when not active */}
        {place.instagram_access_token && (
          <div className={activeTab === 'Información' ? 'block' : 'hidden'}>
            <div className="pt-6">
              <InstagramFeed 
                accessToken={place.instagram_access_token} 
                userId={place.instagram_user_id || ''} 
                place={place}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'Información' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="space-y-2">
                <p className={`text-gray-600 dark:text-gray-400 leading-relaxed font-medium ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                  {place.full_description}
                </p>
                {place.full_description && place.full_description.length > 150 && (
                  <button 
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-sky-500 dark:text-sky-400 font-bold text-sm hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
                  >
                    {isDescriptionExpanded ? 'Ver menos' : 'Ver más...'}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'Menú' && place?.has_menu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {menuItems.filter(item => item.is_available !== false).length > 0 ? (
                <MenuSection place={place} menuItems={menuItems.filter(item => item.is_available !== false)} />
              ) : (
                <div className="py-10 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                    <Utensils className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No hay menú disponible</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Este lugar aún no ha publicado su menú digital.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Galería' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.map((img: string, i: number) => (
                    <div 
                      key={i} 
                      className="aspect-square rounded-3xl overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 shadow-sm"
                      onClick={() => setLightboxIndex(i)}
                    >
                      <ElegantImage 
                        src={optimizeImageUrl(img, 600)} 
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" 
                        alt={`Gallery ${i}`}
                        containerClassName="w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                    <Image className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No hay fotos disponibles</h3>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Tours' && (place?.category_name?.toLowerCase() === 'parques' || categories.find(c => c.id === place?.category_id)?.name.toLowerCase() === 'parques') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {tours.length > 0 ? (
                tours.map((tour) => (
                  <div key={tour.id} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tour.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{tour.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sky-500 dark:text-sky-400 font-black text-xl">${tour.price.toLocaleString()}</div>
                        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Por persona</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-sky-500" />
                        {tour.duration}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                    <Calendar className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No hay tours disponibles</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Vuelve más tarde para ver las actividades programadas.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Reseñas' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {user ? (
                (editingReview || !hasUserReviewed) ? (
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">{editingReview ? 'Edita tu reseña' : 'Deja tu reseña'}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-8 h-8 cursor-pointer ${star <= (editingReview ? editingReview.rating : newReviewRating) ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`}
                          onClick={() => editingReview ? setEditingReview({...editingReview, rating: star}) : setNewReviewRating(star)}
                        />
                      ))}
                    </div>
                    <textarea 
                      className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mb-4"
                      placeholder="Escribe tu reseña..."
                      value={editingReview ? editingReview.comment : newReviewComment}
                      onChange={(e) => editingReview ? setEditingReview({...editingReview, comment: e.target.value}) : setNewReviewComment(e.target.value)}
                    />
                    <button 
                      onClick={handleSubmitReview}
                      className="bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-sky-600 transition-all"
                    >
                      {editingReview ? 'Actualizar reseña' : 'Publicar reseña'}
                    </button>
                    {editingReview && (
                      <button onClick={() => setEditingReview(null)} className="ml-4 text-gray-500 font-bold">Cancelar</button>
                    )}
                  </div>
                ) : null
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Inicia sesión para dejar una reseña.</p>
                  <button onClick={() => setIsLoginModalOpen(true)} className="bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold">Iniciar sesión</button>
                </div>
              )}

              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                      {review.user_avatar ? (
                        <ElegantImage 
                          src={optimizeImageUrl(review.user_avatar, 100)} 
                          alt={review.user_name}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                          sizes="48px"
                        />
                      ) : (
                        <User className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">{review.user_name}</h4>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-orange-400 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{review.comment}</p>
                      {user && user.id === review.user_id && (
                        <button onClick={() => setEditingReview(review)} className="text-sky-500 text-xs font-bold mt-2">Editar</button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aún no hay reseñas</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Sé el primero en compartir tu experiencia sobre este lugar.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Modal */}
      <div 
        className={`fixed inset-0 z-[200] flex items-center justify-center bg-black transition-opacity duration-300 ${isVideoModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => {
          setIsVideoModalOpen(false);
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          }
        }}
      >
        {place.youtube_video_url && getYoutubeVideoId(place.youtube_video_url) && (
          <div 
            className="relative w-full h-full bg-black flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setIsVideoModalOpen(false);
                if (iframeRef.current && iframeRef.current.contentWindow) {
                  iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                }
              }}
              className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
            <iframe 
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${getYoutubeVideoId(place.youtube_video_url)}?enablejsapi=1&playsinline=1`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && gallery.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button 
              className="absolute top-6 right-6 z-[210] w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-all shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
            >
              <X className="w-6 h-6" />
            </button>
            
            <div 
              className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
              onClick={(e) => e.stopPropagation()}
            >
              <ElegantImage 
                src={gallery[lightboxIndex]} 
                alt={`Gallery ${lightboxIndex}`}
                className="w-full h-full object-contain"
                containerClassName="w-full h-full"
                priority={true}
                sizes="100vw"
              />
              
              {gallery.length > 1 && (
                <>
                  <button 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => prev === null ? null : (prev === 0 ? gallery.length - 1 : prev - 1));
                    }}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => prev === null ? null : (prev === gallery.length - 1 ? 0 : prev + 1));
                    }}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full">
                {lightboxIndex + 1} / {gallery.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  );
}

