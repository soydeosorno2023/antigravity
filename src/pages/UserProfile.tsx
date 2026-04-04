import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Heart, LogOut, Settings, MapPin, Camera, Loader2, LogIn, ChevronRight, History, Navigation, Phone, Save, X, ChevronLeft, Sun, Moon, ThumbsUp, Facebook, Check } from 'lucide-react';
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
import './UserProfile.css';

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
  const [myPlaces, setMyPlaces] = useState<Place[]>([]);
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

        // Fetch user's assigned places if they are an owner
        if (user.role === 'owner' && user.assigned_place_ids && user.assigned_place_ids.length > 0) {
          try {
            const places = await api.getPlacesByIds(user.assigned_place_ids);
            setMyPlaces(places);
          } catch (e) {
            console.error("Error fetching assigned places:", e);
            setMyPlaces([]);
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
    <div className="user-profile-wrapper">
      <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  );

  if (!user) {
    return (
      <div className="user-profile-wrapper">
        <div className="profile-bg-glow-1" />
        <div className="profile-bg-glow-2" />

        <div className="auth-card">
          <button onClick={() => navigate(-1)} className="auth-back-btn">
            <ChevronLeft size={20} />
          </button>

          <div className="auth-icon-box">
            <User size={40} />
          </div>

          <h1 className="auth-title">Bienvenido</h1>
          <p className="auth-subtitle">Inicia sesión para guardar tus lugares favoritos y acceder a funciones exclusivas.</p>
          
          {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

          <div className="auth-social-group">
            <button onClick={handleGoogleLogin} disabled={isLoggingIn} className="auth-btn google">
              {isLoggingIn ? <Loader2 size={24} className="animate-spin" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={24} height={24} alt="Google" />}
              {isLoggingIn ? 'Conectando...' : 'Continuar con Google'}
            </button>

            <button
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
              className="auth-btn facebook"
            >
              {isLoggingIn ? <Loader2 size={24} className="animate-spin" /> : <Facebook size={24} fill="white" />}
              {isLoggingIn ? 'Conectando...' : 'Continuar con Facebook'}
            </button>
          </div>

          <div className="auth-divider">
            <span>O usa tu celular</span>
          </div>

          <div className="phone-input-group">
            <div className="phone-field-wrapper">
              <Phone className="phone-field-icon" size={20} />
              <input
                type="tel"
                placeholder="Número celular (+569...)"
                className="phone-input"
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div id="recaptcha-container" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}></div>
            
            {!confirmationResult ? (
              <button onClick={handlePhoneLogin} className="sms-submit-btn">
                Enviar código por SMS
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem' }}>
                <input
                  type="text"
                  placeholder="Ej: 123456"
                  className="phone-input"
                  style={{ textAlign: 'center', letterSpacing: '8px' }}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button onClick={handleVerifyCode} className="sms-submit-btn" style={{ background: 'var(--success)' }}>
                  Confirmar código
                </button>
              </motion.div>
            )}
          </div>

          <Link to="/admin" className="auth-admin-link">
            <Settings size={16} />
            Acceso Dueños de Local
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <SEO title="Mi Perfil" noindex />
      
      <div className="profile-card-main animate-fade-up">
        <div className="profile-banner">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {user.avatar_url ? (
                <ElegantImage 
                  src={optimizeImageUrl(user.avatar_url, 256)} 
                  alt={user.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={64} />
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[22px] opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                {isUploading ? <Loader2 size={32} className="text-white animate-spin" /> : <Camera size={32} className="text-white" />}
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
              </label>
            </div>
          </div>
        </div>
        
        <div className="profile-details">
          {saveSuccess && <div className="success-banner">¡Perfil actualizado!</div>}

          <div className="profile-info-header">
            <div className="profile-name-group">
              <h1>{user.full_name}</h1>
              <div className="profile-meta-item"><Mail size={16} /> {user.email}</div>
              {user.phone && <div className="profile-meta-item"><Phone size={16} /> {user.phone}</div>}
              {user.address && <div className="profile-meta-item"><MapPin size={16} /> {user.address}</div>}
            </div>

            <div className="profile-actions">
              {(user.role === 'admin' || user.role === 'owner') && (
                <Link to="/admin/dashboard" className="profile-btn profile-btn-primary">
                  <Settings size={20} /> Panel
                </Link>
              )}
              <button onClick={() => setIsEditing(true)} className="profile-btn profile-btn-secondary">
                <Settings size={20} />
              </button>
              <button onClick={handleLogout} className="profile-btn profile-btn-danger">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-sections">
        {/* Favoritos Section */}
        <div className="profile-section">
          <div className="section-header">
            <div className="section-title-group">
              <div className="section-icon"><Heart size={24} /></div>
              <div>
                <h2 className="section-title">Mis Favoritos</h2>
                <p className="section-subtitle">{favorites.length} lugares guardados</p>
              </div>
            </div>
            <Link to="/favoritos" className="register-link">Ver todo</Link>
          </div>

          {favoritePlaces.length > 0 ? (
            <div className="place-grid-mini" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {favoritePlaces.map(place => (
                <Link key={place.id} to={`/lugar/${place.slug}`} className="mini-card card">
                  <ElegantImage src={place.profile_image_url} alt={place.name} style={{ height: '120px', width: '100%', objectFit: 'cover' }} />
                  <div style={{ padding: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800' }} className="truncate">{place.name}</h4>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Heart className="empty-icon" />
              <p>Aún no tienes favoritos.</p>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="profile-section">
          <div className="section-header">
            <div className="section-title-group">
              <div className="section-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#0ea5e9' }}><History size={24} /></div>
              <div>
                <h2 className="section-title">Historial</h2>
                <p className="section-subtitle">Lugares visitados recientemente</p>
              </div>
            </div>
          </div>

          {historyPlaces.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {historyPlaces.map(place => (
                <HorizontalPlaceCard key={place.id} place={place} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <History className="empty-icon" />
              <p>No hay historial de visitas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay glass" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
              <h2 className="section-title">Editar Perfil</h2>
              <button onClick={() => setIsEditing(false)}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="login-input"
                  style={{ paddingLeft: '1rem' }}
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="login-input"
                  style={{ paddingLeft: '1rem' }}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="login-input"
                  style={{ paddingLeft: '1rem' }}
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              
              <button onClick={handleSaveProfile} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {isUploading ? <Loader2 size={24} className="animate-spin" /> : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
