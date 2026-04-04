import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Plus, Edit2, Trash2, Star, Eye, LogOut, Palmtree, 
  Globe, Loader2, X, Check,
  LayoutDashboard, Layers, Search,
  Bell, HelpCircle, ChevronRight, TrendingUp,
  Download, UploadCloud, Instagram, RefreshCw
} from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import { api } from '../services/api';
import { auth } from '../firebase';
import { Place, Category, Subcategory, User, AppSettings, Media, Commune, AppNotification, MenuItem, Tour } from '../types';
import { SEO } from '../components/SEO';
import { optimizeImageUrl } from '../utils/image';
import { ElegantImage } from '../components/ElegantImage';
import { useData } from '../context/DataContext';

// Modular Components
import './AdminDashboard.css';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminPlaces } from '../components/admin/AdminPlaces';
import { AdminCategories } from '../components/admin/AdminCategories';
import { AdminCommunes } from '../components/admin/AdminCommunes';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminMedia } from '../components/admin/AdminMedia';
import { AdminNotifications } from '../components/admin/AdminNotifications';
import { AdminSettings } from '../components/admin/AdminSettings';
import { AdminProfile } from '../components/admin/AdminProfile';

const libraries: ("places")[] = ["places"];

export function AdminDashboard() {
  const { user, loading: authLoading, logout, updateUser, isOwner } = useAuth();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    version: 'weekly',
    libraries
  });

  const { unreadCount, markNotificationsAsRead } = useData();
  const [places, setPlaces] = useState<Place[]>([]);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [communeAutocomplete, setCommuneAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'places' | 'categories' | 'profile' | 'settings' | 'help' | 'media' | 'communes' | 'notifications' | 'users'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [isUpdatingUser, setIsUpdatingUser] = useState<string | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'Map', image_url: '', slug: '', order_index: 0 });

  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [newSubcategory, setNewSubcategory] = useState({ name: '', category_id: '', slug: '', order_index: 0 });

  const [isAddingCommune, setIsAddingCommune] = useState(false);
  const [editingCommune, setEditingCommune] = useState<Commune | null>(null);
  const [newCommune, setNewCommune] = useState({ name: '', lat: 0, lng: 0, image_url: '' });

  const [isAddingNotification, setIsAddingNotification] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AppNotification | null>(null);
  const [newNotification, setNewNotification] = useState({ 
    title: '', 
    message: '', 
    type: 'info' as AppNotification['type'], 
    image_url: '',
    link_url: '',
    is_active: true 
  });

  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ status: string; database: string; mysql_host: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(setDbStatus)
      .catch(() => setDbStatus({ status: 'error', database: 'unknown', mysql_host: 'error' }));
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'admin') {
      api.getUsers().then(setUsers).catch(console.error);
    }
  }, [activeTab, user]);

  const [tours, setTours] = useState<Tour[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeSubForm, setActiveSubForm] = useState<'details' | 'menu' | 'tours' | 'reviews'>('details');
  const [isAddingTour, setIsAddingTour] = useState(false);
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [newTour, setNewTour] = useState({ name: '', description: '', price: 0, duration: '', image_url: '' });
  const [newMenuItem, setNewMenuItem] = useState<Omit<MenuItem, 'id' | 'place_id'>>({ 
    name: '', 
    description: '', 
    price: 0, 
    image_url: '', 
    category: '', 
    is_available: true,
    sizes: [],
    addons: []
  });
  const [newPlace, setNewPlace] = useState<Omit<Partial<Place>, 'gallery'> & { gallery: string[] }>({
    name: '',
    category_id: '',
    subcategory_id: '',
    full_description: '',
    profile_image_url: '',
    cover_image_url: '',
    address: '',
    lat: 0,
    lng: 0,
    phone: '',
    whatsapp: '',
    website: '',
    hours: '',
    youtube_video_url: '',
    owner_id: '',
    slug: '',
    is_featured: false,
    is_active: true,
    is_pet_friendly: false,
    has_parking: false,
    has_wifi: false,
    has_menu: false,
    gallery: [] as string[]
  });
  const [confirmDelete, setConfirmDelete] = useState<{ type: string, id: string, extraData?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectingPlacesForUser, setSelectingPlacesForUser] = useState<User | null>(null);
  const [tempAssignedPlaces, setTempAssignedPlaces] = useState<string[]>([]);
  const [placeSearchTerm, setPlaceSearchTerm] = useState('');
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', avatar_url: '' });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    logo_url: '',
    hero_image_url: '',
    hero_title: 'Descubre el mundo',
    contact_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  const userRole = user?.role || localStorage.getItem('user_role') || sessionStorage.getItem('user_role');

  useEffect(() => {
    if (activeTab === 'notifications' && unreadCount > 0) {
      markNotificationsAsRead();
    }
  }, [activeTab, unreadCount, markNotificationsAsRead]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      navigate('/admin');
      return;
    }

    setProfileForm({ 
      full_name: user.full_name, 
      email: user.email, 
      avatar_url: user.avatar_url || '' 
    });

    const unsubPlaces = api.subscribeToPlaces({ 
      admin: true, 
      ownerId: user.role === 'owner' ? user.id : undefined
    }, setPlaces);
    const unsubCategories = api.subscribeToCategories(setCategories);
    const unsubSubcategories = api.subscribeToSubcategories(setSubcategories);
    const unsubSettings = api.subscribeToSettings(setAppSettings);
    const unsubMedia = api.subscribeToMedia(setMedia, user.role === 'owner' ? user.id : undefined);
    const unsubCommunes = api.subscribeToCommunes(setCommunes);
    const unsubNotifications = api.subscribeToNotifications(setNotifications);

    return () => {
      unsubPlaces();
      unsubCategories();
      unsubSubcategories();
      unsubSettings();
      unsubMedia();
      unsubCommunes();
      unsubNotifications();
    };
  }, [navigate, user, authLoading]);

  // Auto-fix owner_ids for admins
  useEffect(() => {
    if (user?.role === 'admin' && users.length > 0 && places.length > 0) {
      const fixOwnerIds = async () => {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        for (const u of users) {
          if (u.role === 'owner' && u.assigned_place_ids && u.assigned_place_ids.length > 0) {
            for (const placeId of u.assigned_place_ids) {
              const place = places.find(p => p.id === placeId);
              if (place && place.owner_id !== u.id) {
                try {
                  await api.updatePlace(token, place.id, { owner_id: u.id });
                } catch (err) {
                  console.error(`Failed to fix owner_id for place ${place.id}:`, err);
                }
              }
            }
          }
        }
      };
      fixOwnerIds();
    }
  }, [user, users, places]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    );
  }

  // Handlers (Copy logic from previous monolithic state)
  const handleDeleteMedia = async (item: Media) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      setLoading(true);
      await api.deleteMedia(token, item);
      setSuccess('Imagen eliminada con éxito');
      setConfirmDelete(null);
    } catch (err) {
      setError('Error al eliminar imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateUser(profileForm);
      setSuccess('Perfil actualizado con éxito');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al actualizar perfil');
    }
  };

  const handleExportData = () => {
    const data = { places, categories };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        setLoading(true);
        if (data.categories) {
          for (const cat of data.categories) {
            const { id, ...catData } = cat;
            await api.createCategory(token, catData);
          }
        }
        if (data.places) {
          for (const place of data.places) {
            const { id, ...placeData } = place;
            await api.createPlace(token, placeData);
          }
        }
        setSuccess('Datos importados con éxito');
      } catch (err) {
        setError('Error al importar datos');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDeletePlace = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await api.deletePlace(token, id);
      setConfirmDelete(null);
    } catch (err) {
      setError('Error al eliminar lugar');
    }
  };

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const placeContent = autocomplete.getPlace();
      setNewPlace(prev => ({
        ...prev,
        address: placeContent.formatted_address || '',
        lat: placeContent.geometry?.location?.lat() || 0,
        lng: placeContent.geometry?.location?.lng() || 0
      }));
    }
  };

  const handleCommuneChanged = () => {
    if (communeAutocomplete !== null) {
      const p = communeAutocomplete.getPlace();
      setNewCommune(prev => ({
        ...prev,
        name: p.name || p.formatted_address || '',
        lat: p.geometry?.location?.lat() || 0,
        lng: p.geometry?.location?.lng() || 0
      }));
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
      setIsUpdatingUser(userId);
      await api.updateUser(userId, data);
      toast.success('Usuario actualizado correctamente');
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      setLoading(true);
      await api.deleteUser(uid);
      setSuccess('Usuario eliminado con éxito');
      setConfirmDelete(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      let owner_id = isOwner ? auth.currentUser?.uid : newPlace.owner_id;
      if (editingPlace) {
        await api.updatePlace(token, editingPlace.id, { ...newPlace, owner_id, gallery: JSON.stringify(newPlace.gallery) });
        setEditingPlace(null);
      } else {
        await api.createPlace(token, { ...newPlace, owner_id, gallery: JSON.stringify(newPlace.gallery) });
      }
      setIsAddingPlace(false);
      resetPlaceForm();
      setSuccess('Lugar guardado con éxito');
    } catch (err) {
      setError('Error al procesar lugar');
    }
  };

  const resetPlaceForm = () => {
    setNewPlace({
      name: '', category_id: categories[0]?.id || '', subcategory_id: '',
      full_description: '', profile_image_url: '', cover_image_url: '',
      address: '', lat: 0, lng: 0, phone: '', whatsapp: '', website: '',
      hours: '', youtube_video_url: '', owner_id: '', slug: '',
      is_featured: false, is_active: true, is_pet_friendly: false,
      has_parking: false, has_wifi: false, has_menu: false, gallery: []
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check limit of 10 files
    if (files.length > 10) {
      setError('Máximo 10 archivos por tanda');
      return;
    }

    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      setError('Debes iniciar sesión para subir archivos');
      return;
    }

    setIsUploading(true);
    setSuccess(`Procesando ${files.length} archivo(s)...`);

    try {
      if (target === 'gallery') {
        const uploaded = await Promise.all(
          Array.from(files).map(async (file, index) => {
            if (files.length > 1) setSuccess(`Convirtiendo y subiendo (${index + 1}/${files.length})...`);
            return api.uploadImage(token, file);
          })
        );
        
        // Only update newPlace gallery if we are not in the Media tab
        if (activeTab === 'places' || activeTab === 'overview') {
          setNewPlace(prev => ({ 
            ...prev, 
            gallery: [...prev.gallery, ...uploaded.map(u => u.url)] 
          }));
        }
        setSuccess('¡Archivos subidos con éxito!');
      } else {
        setSuccess('Convirtiendo y subiendo...');
        const { url } = await api.uploadImage(token, files[0]);
        
        if (target === 'profile') setNewPlace(prev => ({ ...prev, profile_image_url: url }));
        else if (target === 'cover') setNewPlace(prev => ({ ...prev, cover_image_url: url }));
        else if (target === 'category') setNewCategory(prev => ({ ...prev, image_url: url }));
        else if (target === 'settings') setAppSettings(prev => ({ ...prev, logo_url: url }));
        else if (target === 'hero') setAppSettings(prev => ({ ...prev, hero_image_url: url }));
        else if (target === 'commune') setNewCommune(prev => ({ ...prev, image_url: url }));
        else if (target === 'notification') setNewNotification(prev => ({ ...prev, image_url: url }));
        else if (target === 'menu') setNewMenuItem(prev => ({ ...prev, image_url: url }));
        else if (target === 'tour') setNewTour(prev => ({ ...prev, image_url: url }));
        else if (target === 'user_profile') setProfileForm(prev => ({ ...prev, avatar_url: url }));
        
        setSuccess('Imagen cargada correctamente');
      }
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (editingPlace) {
      const unsubTours = api.subscribeToTours(editingPlace.id, setTours);
      const unsubReviews = api.subscribeToReviews(editingPlace.id, setReviews);
      const unsubMenu = api.subscribeToMenuItems(editingPlace.id, setMenuItems);
      return () => { unsubTours(); unsubReviews(); unsubMenu(); };
    }
  }, [editingPlace]);

  const startEditPlace = (place: Place) => {
    setEditingPlace(place);
    setNewPlace({
      ...place,
      is_featured: place.is_featured === 1 || place.is_featured === true,
      is_active: place.is_active === 1 || place.is_active === true,
      gallery: (() => {
        try { return typeof place.gallery === 'string' ? JSON.parse(place.gallery || '[]') : (Array.isArray(place.gallery) ? place.gallery : []); }
        catch (e) { return []; }
      })()
    } as any);
    setIsAddingPlace(true);
    setActiveTab('places');
  };

  const handleConnectInstagram = async (placeId: string | undefined) => {
    if (!placeId) {
      setError('Debes guardar el lugar antes de conectar Instagram');
      return;
    }
    try {
      const response = await fetch(`/api/instagram/auth-url?placeId=${encodeURIComponent(placeId)}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      if (url) {
        const authWindow = window.open(url, 'instagram_auth', 'width=600,height=700');
        if (!authWindow) setError('El bloqueador de ventanas emergentes impidió abrir la ventana.');
      }
    } catch (err) {
      setError('Error al conectar con Instagram');
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'INSTAGRAM_AUTH_SUCCESS') {
        const { placeId, data } = event.data;
        if (editingPlace && editingPlace.id === placeId) {
          setEditingPlace(prev => prev ? { ...prev, ...data } : null);
        }
        setNewPlace(prev => ({ ...prev, ...data }));
        const token = await auth.currentUser?.getIdToken();
        if (placeId && token) {
          try {
            await api.updatePlace(token, placeId, data);
            setSuccess('Instagram conectado y guardado con éxito.');
          } catch (err: any) {
            setError('Error al guardar la conexión de Instagram: ' + err.message);
          }
        } else {
          setSuccess('Instagram conectado. Recuerda guardar los cambios del lugar.');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [editingPlace]);

  const handleAddTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await api.createTour(token, { ...newTour, place_id: editingPlace.id });
      setIsAddingTour(false);
      setNewTour({ name: '', description: '', price: 0, duration: '', image_url: '' });
    } catch (err) { setError('Error al añadir tour'); }
  };

  const handleDeleteTour = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await api.deleteTour(token, id);
      setConfirmDelete(null);
    } catch (err) { setError('Error al eliminar tour'); }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      if (editingMenuItem) await api.updateMenuItem(editingPlace.id, editingMenuItem.id, newMenuItem);
      else await api.createMenuItem(editingPlace.id, newMenuItem);
      setIsAddingMenuItem(false);
      setEditingMenuItem(null);
      setNewMenuItem({ name: '', description: '', price: 0, image_url: '', category: '', is_available: true, sizes: [], addons: [] });
    } catch (err) { setError('Error en el menú'); }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || !editingPlace) return;
      await api.deleteMenuItem(editingPlace.id, id);
      setConfirmDelete(null);
    } catch (err) { setError('Error al eliminar ítem'); }
  };

  const startEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setNewMenuItem({ ...item });
    setIsAddingMenuItem(true);
  };

  const handleToggleMenuItemAvailability = async (item: MenuItem) => {
    if (!editingPlace) return;
    try {
      await api.updateMenuItem(editingPlace.id, item.id, { is_available: !item.is_available });
    } catch (err) { setError('Error al cambiar disponibilidad'); }
  };

  const handleAddCommune = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCommune) await api.updateCommune(editingCommune.id, newCommune);
      else await api.createCommune(newCommune);
      setIsAddingCommune(false);
      setNewCommune({ name: '', lat: 0, lng: 0, image_url: '' });
      setSuccess('Comuna guardada');
    } catch (err) { setError('Error en comuna'); }
  };

  const handleDeleteCommune = async (id: string) => {
    try { await api.deleteCommune(id); setConfirmDelete(null); }
    catch (err) { setError('Error al eliminar comuna'); }
  };

  const handleSaveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNotification) await api.updateNotification(editingNotification.id, newNotification);
      else await api.createNotification(newNotification);
      setIsAddingNotification(false);
      setSuccess('Notificación guardada');
    } catch (err) { setError('Error en notificación'); }
  };

  const handleDeleteNotification = async (id: string) => {
    try { await api.deleteNotification(id); setConfirmDelete(null); }
    catch (err) { setError('Error al eliminar'); }
  };

  const startEditNotification = (n: AppNotification) => {
    setEditingNotification(n);
    setNewNotification({ ...n, image_url: n.image_url || '', link_url: n.link_url || '' });
    setIsAddingNotification(true);
  };

  const startEditCommune = (c: Commune) => {
    setEditingCommune(c);
    setNewCommune({ name: c.name, lat: c.lat, lng: c.lng, image_url: c.image_url || '' });
    setIsAddingCommune(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      if (editingCategory) await api.updateCategory(token, editingCategory.id, newCategory);
      else await api.createCategory(token, { ...newCategory, order_index: categories.length });
      setIsAddingCategory(false);
      setSuccess('Categoría guardada');
    } catch (err) { setError('Error en categoría'); }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await api.deleteCategory(token, id);
      setConfirmDelete(null);
    } catch (err) { setError('Error al eliminar'); }
  };

  const handleReorderCategory = async (id: string, direction: 'up' | 'down') => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const sorted = [...categories].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const index = sorted.findIndex(c => c.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const otherCat = sorted[newIndex];
    const currentCat = sorted[index];
    try {
      const tempOrder = currentCat.order_index || 0;
      const targetOrder = otherCat.order_index || 0;
      const finalTargetOrder = targetOrder === tempOrder ? (direction === 'up' ? tempOrder - 1 : tempOrder + 1) : targetOrder;
      await api.updateCategory(token, currentCat.id, { ...currentCat, order_index: finalTargetOrder });
      await api.updateCategory(token, otherCat.id, { ...otherCat, order_index: tempOrder });
    } catch (err) {
      setError('Error al reordenar categorías');
    }
  };

  const handleReorderSubcategory = async (id: string, direction: 'up' | 'down') => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const sub = subcategories.find(s => s.id === id);
    if (!sub) return;
    const filteredSubs = subcategories.filter(s => s.category_id === sub.category_id).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const index = filteredSubs.findIndex(s => s.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= filteredSubs.length) return;
    const otherSub = filteredSubs[newIndex];
    const currentSub = filteredSubs[index];
    try {
      const tempOrder = currentSub.order_index || 0;
      const targetOrder = otherSub.order_index || 0;
      const finalTargetOrder = targetOrder === tempOrder ? (direction === 'up' ? tempOrder - 1 : tempOrder + 1) : targetOrder;
      await api.updateSubcategory(token, currentSub.id, { ...currentSub, order_index: finalTargetOrder });
      await api.updateSubcategory(token, otherSub.id, { ...otherSub, order_index: tempOrder });
    } catch (err) {
      setError('Error al reordenar subcategorías');
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategory({ name: cat.name, icon: cat.icon, image_url: cat.image_url || '', slug: cat.slug, order_index: cat.order_index || 0 });
    setIsAddingCategory(true);
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      if (editingSubcategory) await api.updateSubcategory(token, editingSubcategory.id, newSubcategory);
      else await api.createSubcategory(token, { ...newSubcategory, order_index: subcategories.length });
      setIsAddingSubcategory(false);
      setSuccess('Subcategoría guardada');
    } catch (err) { setError('Error en subcategoría'); }
  };

  const handleDeleteSubcategory = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await api.deleteSubcategory(token || '', id);
      setConfirmDelete(null);
    } catch (err) { setError('Error'); }
  };

  const startEditSubcategory = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    setNewSubcategory({ name: sub.name, category_id: sub.category_id, slug: sub.slug, order_index: sub.order_index || 0 });
    setIsAddingSubcategory(true);
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await api.updateSettings(token, appSettings);
      setSuccess('Ajustes actualizados');
    } catch (err) { setError('Error en ajustes'); }
  };

  const filteredPlaces = places.filter(p => {
    const s = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(s) || (p.address || '').toLowerCase().includes(s);
  });

  return (
    <div className="admin-layout">
      <SEO title="Panel de Administración" noindex />
      
      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <div className="w-8 h-8 bg-sky-600 dark:bg-sky-500 rounded-lg flex items-center justify-center text-white">
          <Palmtree className="w-5 h-5" />
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Component */}
      <AdminSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navigate={navigate}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={user}
        userRole={userRole}
        unreadCount={unreadCount}
        markNotificationsAsRead={markNotificationsAsRead}
        handleLogout={logout}
        handleExportData={handleExportData}
        handleImportData={handleImportData}
      />

        <div className="sidebar-logo">
          <div className="sidebar-logo-icon bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl shadow-orange-500/20">
            <Palmtree className="w-8 h-8 text-white" />
          </div>
          <div className="mt-4">
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">ANTIGRAVITY</h1>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Management</p>
          </div>
        </div>

      <main className="admin-main">
        <div className="admin-main-container">
          <header className="admin-header">
              <div className="admin-breadcrumb flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin</span>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">{activeTab}</span>
              </div>
              <h1 className="admin-title">
                {activeTab === 'overview' ? 'Panel de Control' : 
                 activeTab === 'places' ? 'Lugares' :
                 activeTab === 'users' ? 'Usuarios' :
                 activeTab === 'categories' ? 'Categorías' :
                 activeTab === 'media' ? 'Multimedia' :
                 activeTab === 'profile' ? 'Mi Perfil' :
                 activeTab === 'communes' ? 'Comunas' :
                 activeTab === 'notifications' ? 'Notificaciones' :
                 activeTab === 'settings' ? 'Configuración' : 'Ayuda'}
              </h1>

            <div className="admin-header-actions">
              <div className="admin-db-status">
                <div className="admin-db-status-container">
                  <div className={`admin-status-dot ${dbStatus?.status === 'ok' ? 'status-ok' : 'status-error'}`}></div>
                  <span className="admin-status-text">DB Status</span>
                </div>
              </div>

              <div className="admin-search-container">
                <Search className="admin-search-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar..."
                  className="admin-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <button onClick={() => setActiveTab('notifications')} className="admin-notification-btn">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="admin-badge">{unreadCount}</span>}
              </button>

              {userRole === 'admin' && activeTab !== 'media' && (
                <button
                  onClick={() => {
                    if (activeTab === 'categories') setIsAddingCategory(true);
                    else if (activeTab === 'communes') setIsAddingCommune(true);
                    else { resetPlaceForm(); setIsAddingPlace(true); setActiveTab('places'); }
                  }}
                  className="admin-btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  <span className="admin-btn-text">Nuevo</span>
                </button>
              )}
            </div>
          </header>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <AdminOverview 
              userRole={userRole} places={places} categories={categories} 
              reviews={reviews} media={media} setActiveTab={setActiveTab} 
              startEditPlace={startEditPlace} handleImportData={handleImportData} 
            />
          )}

          {activeTab === 'places' && (
            <AdminPlaces 
              places={places} filteredPlaces={filteredPlaces} categories={categories} subcategories={subcategories}
              isAddingPlace={isAddingPlace} setIsAddingPlace={setIsAddingPlace} editingPlace={editingPlace} setEditingPlace={setEditingPlace}
              newPlace={newPlace} setNewPlace={setNewPlace} handleAddPlace={handleAddPlace} resetPlaceForm={resetPlaceForm}
              startEditPlace={startEditPlace} setConfirmDelete={setConfirmDelete} handleImageUpload={handleImageUpload}
              isUploading={isUploading} userRole={userRole} isLoaded={isLoaded} setAutocomplete={setAutocomplete}
              handlePlaceChanged={handlePlaceChanged} activeSubForm={activeSubForm} setActiveSubForm={setActiveSubForm}
              menuItems={menuItems} newMenuItem={newMenuItem} setNewMenuItem={setNewMenuItem} handleAddMenuItem={handleAddMenuItem}
              startEditMenuItem={startEditMenuItem} handleToggleMenuItemAvailability={handleToggleMenuItemAvailability}
              tours={tours} newTour={newTour} setNewTour={setNewTour} handleAddTour={handleAddTour}
              isAddingTour={isAddingTour} setIsAddingTour={setIsAddingTour} reviews={reviews}
              isAddingMenuItem={isAddingMenuItem} setIsAddingMenuItem={setIsAddingMenuItem} editingMenuItem={editingMenuItem}
              handleConnectInstagram={handleConnectInstagram}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsers 
              users={users} currentUser={user as any} isUpdatingUser={isUpdatingUser} handleUpdateUser={handleUpdateUser}
              setConfirmDelete={setConfirmDelete} places={places} selectingPlacesForUser={selectingPlacesForUser}
              setSelectingPlacesForUser={setSelectingPlacesForUser} tempAssignedPlaces={tempAssignedPlaces}
              setTempAssignedPlaces={setTempAssignedPlaces} placeSearchTerm={placeSearchTerm} setPlaceSearchTerm={setPlaceSearchTerm}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategories 
              categories={categories} subcategories={subcategories} isAddingCategory={isAddingCategory}
              setIsAddingCategory={setIsAddingCategory} editingCategory={editingCategory} setEditingCategory={setEditingCategory}
              newCategory={newCategory} setNewCategory={setNewCategory} handleAddCategory={handleAddCategory}
              isAddingSubcategory={isAddingSubcategory} setIsAddingSubcategory={setIsAddingSubcategory}
              editingSubcategory={editingSubcategory} setEditingSubcategory={setEditingSubcategory}
              newSubcategory={newSubcategory} setNewSubcategory={setNewSubcategory} handleAddSubcategory={handleAddSubcategory}
              handleMoveCategory={handleReorderCategory} handleMoveSubcategory={handleReorderSubcategory}
              startEditCategory={startEditCategory} startEditSubcategory={startEditSubcategory}
              setConfirmDelete={setConfirmDelete} handleImageUpload={handleImageUpload} isUploading={isUploading}
            />
          )}

          {activeTab === 'communes' && (
            <AdminCommunes 
              communes={communes} isAddingCommune={isAddingCommune} setIsAddingCommune={setIsAddingCommune}
              editingCommune={editingCommune} setEditingCommune={setEditingCommune} newCommune={newCommune}
              setNewCommune={setNewCommune} handleAddCommune={handleAddCommune} isLoaded={isLoaded}
              setCommuneAutocomplete={setCommuneAutocomplete} handleCommuneChanged={handleCommuneChanged}
              startEditCommune={startEditCommune} setConfirmDelete={setConfirmDelete}
              handleImageUpload={handleImageUpload} isUploading={isUploading}
            />
          )}

          {activeTab === 'media' && (
            <AdminMedia media={media} isUploading={isUploading} handleImageUpload={handleImageUpload} setConfirmDelete={setConfirmDelete} />
          )}

          {activeTab === 'notifications' && (
            <AdminNotifications 
              notifications={notifications} userRole={userRole} isAddingNotification={isAddingNotification}
              setIsAddingNotification={setIsAddingNotification} editingNotification={editingNotification}
              setEditingNotification={setEditingNotification} newNotification={newNotification}
              setNewNotification={setNewNotification} handleSaveNotification={handleSaveNotification}
              handleImageUpload={handleImageUpload} isUploading={isUploading}
              startEditNotification={startEditNotification} setConfirmDelete={setConfirmDelete}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettings 
              appSettings={appSettings} setAppSettings={setAppSettings} handleUpdateSettings={handleUpdateSettings}
              handleImageUpload={handleImageUpload} isUploading={isUploading} handleExportData={handleExportData}
              handleImportData={handleImportData} loading={loading}
            />
          )}

          {activeTab === 'profile' && (
            <AdminProfile 
              user={user as any} profileForm={profileForm} setProfileForm={setProfileForm}
              handleUpdateProfile={handleUpdateProfile} handleImageUpload={handleImageUpload}
              isUploading={isUploading} places={places}
            />
          )}

          {/* Delete Modal */}
          {confirmDelete && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
              <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-10 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¿Estás seguro?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Esta acción no se puede deshacer.</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const { id, type } = confirmDelete;
                      if (type === 'place') handleDeletePlace(id);
                      else if (type === 'category') handleDeleteCategory(id);
                      else if (type === 'subcategory') handleDeleteSubcategory(id);
                      else if (type === 'commune') handleDeleteCommune(id);
                      else if (type === 'media') handleDeleteMedia(confirmDelete.extraData);
                      else if (type === 'tour') handleDeleteTour(id);
                      else if (type === 'notification') handleDeleteNotification(id);
                      else if (type === 'menu') handleDeleteMenuItem(id);
                      else if (type === 'user') handleDeleteUser(id);
                      setConfirmDelete(null);
                    }}
                    className="flex-1 bg-red-600 dark:bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-4 rounded-2xl font-bold">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toasts */}
          {error && (
            <div className="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-xl z-[200] animate-in slide-in-from-bottom-4">
              <p className="font-bold">{error}</p>
              <button onClick={() => setError(null)} className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full p-1 shadow-sm"><X className="w-4 h-4" /></button>
            </div>
          )}
          {success && (
            <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl z-[200] animate-in slide-in-from-bottom-4">
              <p className="font-bold">{success}</p>
              <button onClick={() => setSuccess(null)} className="absolute -top-2 -right-2 bg-white text-emerald-600 rounded-full p-1 shadow-sm"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
