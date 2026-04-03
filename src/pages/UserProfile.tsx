import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Heart, LogOut, Settings, MapPin, Camera, Loader2, LogIn, ChevronRight, History, Navigation, Phone, Save, X, ChevronLeft, Sun, Moon, ThumbsUp, Facebook } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Place, MenuItem } from '../types';
import { ElegantImage } from '../components/ElegantImage';
import { optimizeImageUrl } from '../utils/image';
import { HorizontalPlaceCard } from '../components/HorizontalPlaceCard';
import { calculateDistance } from '../utils/distance';
import { useLocation } from '../context/LocationContext';
import { SEO } from '../components/SEO';
import { RecaptchaVerifier } from 'firebase/auth';

export function UserProfile() {
  const { user, loading, isAdmin, loginWithGoogle, loginWithFacebook, sendPhoneCode, verifyPhoneCode, isLoggingIn, updateUser } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [code, setCode] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const { favorites, toggleFavorite } = useFavorites();
  const { location, setManualAddress } = useLocation();
  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([]);
  const [likedMenuItems, setLikedMenuItems] = useState<(MenuItem & { placeName: string })[]>([]);
  const [historyPlaces, setHistoryPlaces] = useState<Place[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const container = document.getElementById('recaptcha-container');
    if (!container) return;

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
      'isolated': true,
    });
    setRecaptchaVerifier(verifier);
    return () => {
      verifier.clear();
      setRecaptchaVerifier(null);
    };
  }, []);

  const handlePhoneLogin = async () => {
    if (!recaptchaVerifier) return;
    if (!phoneNumber.startsWith('+')) {
      setError('El número de teléfono debe comenzar con +');
      return;
    }
    try {
      const result = await sendPhoneCode(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
    } catch (err) {
      console.error("Phone login error:", err);
      setError('Error al enviar código de teléfono');
    }
  };

  const handleVerifyCode = async () => {
    try {
      await verifyPhoneCode(confirmationResult, code);
      navigate('/perfil');
    } catch (err) {
      console.error("Verify code error:", err);
      setError('Error al verificar código');
    }
  };
  const [myPlace, setMyPlace] = useState<Place | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    address: '',
    phone: ''
  });
  const [loadingData, setLoadingData] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoadingData(true);
      try {
        // Fetch favorite places
        const favs = await api.getMyFavorites();
        setFavoritePlaces(favs.slice(0, 3)); // Show top 3

        // Fetch liked menu items
        const likes = await api.getMyLikes();
        const likedItems = await Promise.all(likes.map(async (like) => {
          try {
            const item = await api.getMenuItem(like.place_id, like.menu_item_id);
            const place = await api.getPlace(like.place_id).catch(() => null);
            return item ? { ...item, placeName: place?.name || 'Lugar desconocido' } : null;
          } catch (e) {
            return null;
          }
        }));
        setLikedMenuItems(likedItems.filter((item): item is (MenuItem & { placeName: string }) => item !== null));

        // Fetch history from localStorage
        const historyIds = JSON.parse(localStorage.getItem('view_history') || '[]');
        if (historyIds.length > 0) {
          const places = await api.getPlacesByIds(historyIds.slice(0, 4));
          setHistoryPlaces(places);
        }

        // Fetch user's assigned place if they are an owner
        if (user.role === 'owner' && user.assigned_place_id) {
          try {
            const place = await api.getPlace(user.assigned_place_id);
            setMyPlace(place);
          } catch (e) {
            console.error("Error fetching assigned place:", e);
            setMyPlace(null);
          }
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && user) {
      fetchData();
      setEditForm({
        full_name: user.full_name || '',
        address: user.address || '',
        phone: user.phone || ''
      });
    }
  }, [user, loading, favorites]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_role');
      navigate('/');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || 'Error al iniciar sesión con Google');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setError('');
    try {
      const { url } = await api.uploadImage(null, file);
      await api.updateProfile('', {
        full_name: user.full_name,
        email: user.email,
        avatar_url: url,
        address: user.address,
        phone: user.phone
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Error al subir avatar: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsUploading(true);
    setError('');
    try {
      await updateUser({
        full_name: editForm.full_name,
        address: editForm.address,
        phone: editForm.phone
      });
      
      // Update manual address in LocationContext if it was changed
      if (editForm.address) {
        setManualAddress(editForm.address);
      }
      
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Error al actualizar perfil: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 px-4 sm:px-6 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/50 dark:border-gray-800/50 text-center relative z-10"
        >
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 p-2.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-24 h-24 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-sky-500/30 transform rotate-3 hover:rotate-6 transition-transform duration-300"
          >
            <User className="w-12 h-12" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-3 tracking-tight">Bienvenido</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-10 leading-relaxed px-4">Inicia sesión para guardar tus lugares favoritos y acceder a funciones exclusivas.</p>
          </motion.div>
          
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-50/80 dark:bg-red-500/10 backdrop-blur-md text-red-600 dark:text-red-400 text-sm font-medium rounded-2xl border border-red-100 dark:border-red-500/20">
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              ) : (
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  className="w-6 h-6 flex-shrink-0" 
                  alt="Google"
                />
              )}
              {isLoggingIn ? 'Conectando...' : 'Continuar con Google'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={async () => {
                if (isLoggingIn) return;
                try {
                  await loginWithFacebook();
                } catch (err: any) {
                  if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') return;
                  setError(err.message || 'Error al iniciar sesión con Facebook');
                }
              }}
              disabled={isLoggingIn}
              className="w-full bg-[#1877F2] text-white py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base hover:bg-[#166FE5] hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <Facebook className="w-5 h-5 fill-current" />
              )}
              {isLoggingIn ? 'Conectando...' : 'Continuar con Facebook'}
            </motion.button>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 relative"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">O usa tu celular</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6"
          >
            <div className="group relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors z-10" />
              <input
                type="tel"
                placeholder="Número celular (+569...)"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium outline-none"
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div id="recaptcha-container" className="mt-4 flex justify-center"></div>
            
            {!confirmationResult ? (
              <button
                type="button"
                onClick={handlePhoneLogin}
                className="w-full mt-4 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Enviar código por SMS
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <input
                  type="text"
                  placeholder="Ej: 123456"
                  className="w-full text-center tracking-[0.5em] text-xl p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-900/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-bold mb-4 outline-none"
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  Confirmar código
                </button>
              </motion.div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800"
          >
            <Link to="/admin" className="text-sm font-bold text-gray-400 hover:text-sky-500 transition-colors flex items-center justify-center gap-2 group">
              <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Acceso Dueños de Local
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 px-6 transition-colors duration-300">
      <SEO 
        title="Mi Perfil"
        description="Gestiona tu perfil en Mira Osorno, revisa tus favoritos y personaliza tu experiencia."
        canonical="/perfil"
      />
      <div className="max-w-4xl mx-auto pt-12">
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white dark:bg-gray-900 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
          <div className="h-48 bg-sky-600 dark:bg-sky-700 relative">
            <div className="absolute -bottom-16 left-10">
              <div className="w-32 h-32 bg-white dark:bg-gray-900 rounded-[2.5rem] p-2 shadow-xl relative group">
                <div className="w-full h-full bg-sky-100 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center text-sky-600 dark:text-sky-400 overflow-hidden">
                  {user.avatar_url ? (
                    <ElegantImage 
                      src={optimizeImageUrl(user.avatar_url, 256)} 
                      alt={user.full_name} 
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                      sizes="128px"
                    />
                  ) : (
                    <User className="w-16 h-16" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                </label>
              </div>
            </div>
          </div>
          
          <div className="pt-20 pb-10 px-10">
            {saveSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                  <Save className="w-4 h-4" />
                </div>
                <span className="font-bold">¡Perfil actualizado correctamente!</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-4 h-4" />
                </div>
                <span className="font-bold">{error}</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white truncate">{user.full_name}</h1>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>
                {user.address && (
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{user.address}</span>
                  </p>
                )}
                {user.phone && (
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{user.phone}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                {(user.role === 'admin' || user.role === 'owner') && (
                  <Link 
                    to="/admin/dashboard"
                    className="p-3 bg-sky-600 dark:bg-sky-500 rounded-2xl text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors flex items-center gap-2 px-6 font-bold"
                  >
                    <Settings className="w-5 h-5" />
                    Panel Control
                  </Link>
                )}
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* My Place Section (For Owners) */}
          {user.role === 'owner' && (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-100 dark:shadow-none">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/20 rounded-[1.5rem] flex items-center justify-center text-sky-500">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Mi Local</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      El establecimiento que administras.
                    </p>
                  </div>
                </div>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                </div>
              ) : myPlace ? (
                <div className="grid grid-cols-1 gap-6">
                  <HorizontalPlaceCard place={myPlace} />
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem]">
                  <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No tienes ningún local asignado aún.</p>
                </div>
              )}
            </div>
          )}

          {/* Favorites Section */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-100 dark:shadow-none">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-[1.5rem] flex items-center justify-center text-red-500">
                  <Heart className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Mis Favoritos</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tienes {favorites.length} {favorites.length === 1 ? 'lugar guardado' : 'lugares guardados'} en tu lista de favoritos.
                  </p>
                </div>
              </div>
              <Link to="/favoritos" className="text-[#F5B027] hover:text-[#e5a017] font-black text-sm flex items-center gap-1 group">
                <span className="flex flex-col items-end">
                  <span>Ver</span>
                  <span>todos</span>
                </span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              </div>
            ) : favoritePlaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {favoritePlaces.map(place => (
                  <Link 
                    key={place.id} 
                    to={`/lugar/${place.slug || place.id}`}
                    className="group relative h-48 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all"
                  >
                    <ElegantImage 
                      src={place.profile_image_url} 
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <h3 className="text-white text-sm font-black leading-tight">{place.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-white/70 text-[10px]">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{place.address}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] mb-8 border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Heart className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-bold">Aún no has guardado favoritos</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Explora lugares y presiona el corazón</p>
              </div>
            )}

            <Link 
              to="/favoritos"
              className="w-full py-5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-[1.5rem] font-black text-center block hover:bg-red-100 dark:hover:bg-red-900/20 transition-all text-lg shadow-sm"
            >
              Gestionar Favoritos
            </Link>
          </div>

          {/* Liked Menu Items Section */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-100 dark:shadow-none">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/20 rounded-[1.5rem] flex items-center justify-center text-sky-500">
                <ThumbsUp className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Mis Likes</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tienes {likedMenuItems.length} {likedMenuItems.length === 1 ? 'ítem guardado' : 'ítems guardados'} en tu lista de likes.
                </p>
              </div>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              </div>
            ) : likedMenuItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {likedMenuItems.map(item => (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl flex items-center gap-4">
                    {item.image_url && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <ElegantImage 
                          src={optimizeImageUrl(item.image_url, 100)} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-grow">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.placeName}</p>
                      <p className="text-sm font-black text-sky-600 dark:text-sky-400 mt-1">${item.price.toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <ThumbsUp className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-bold">Aún no has dado likes</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Explora los menús y presiona el dedito</p>
              </div>
            )}
          </div>

          {/* History Section */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-100 dark:shadow-none">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/20 rounded-[1.5rem] flex items-center justify-center text-sky-600 dark:text-sky-400">
                <History className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Historial de Visitas</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Lugares que has explorado recientemente</p>
              </div>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              </div>
            ) : historyPlaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {historyPlaces.map(place => (
                  <HorizontalPlaceCard key={place.id} place={place} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <History className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-bold">Historial vacío</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Los lugares que visites aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Editar Perfil</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 transition-all text-gray-900 dark:text-white font-medium"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2">Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 transition-all text-gray-900 dark:text-white font-medium"
                    placeholder="Tu dirección"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 transition-all text-gray-900 dark:text-white font-medium"
                    placeholder="Tu teléfono"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-800/50 flex gap-4">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl font-black hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isUploading}
                className="flex-1 py-4 bg-sky-600 text-white rounded-2xl font-black hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
