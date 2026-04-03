import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Plus, Edit2, Trash2, Star, Eye, EyeOff, LogOut, Palmtree, 
  Map as MapIcon, Hotel, Utensils, Globe, Upload, Loader2, X, Check,
  Dog, ParkingCircle, Wifi, Instagram, RefreshCw,
  LayoutDashboard, MapPin, Layers, Image as ImageIcon, Search,
  Bell, Settings, HelpCircle, ChevronRight, TrendingUp, Users,
  ChevronUp, ChevronDown, FileJson, Download, UploadCloud, User as UserIcon,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { api } from '../services/api';
import { auth } from '../firebase';
import { Place, Category, Subcategory, User, AppSettings, Media, Commune, AppNotification } from '../types';
import { SEO } from '../components/SEO';
import { optimizeImageUrl } from '../utils/image';
import { ElegantImage } from '../components/ElegantImage';
import { useData } from '../context/DataContext';

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
  const [tours, setTours] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isAddingTour, setIsAddingTour] = useState(false);
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<any | null>(null);
  const [newTour, setNewTour] = useState({ name: '', description: '', price: 0, duration: '', image_url: '' });
  const [newMenuItem, setNewMenuItem] = useState({ 
    name: '', 
    description: '', 
    price: 0, 
    image_url: '', 
    category: '', 
    is_available: true,
    sizes: [] as { name: string; price: number }[],
    addons: [] as { name: string; price: number }[]
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
    is_featured: 0 as number | boolean,
    is_active: true as number | boolean,
    favorites_count: 0,
    category_name: '',
    subcategory_name: '',
    is_pet_friendly: false,
    has_parking: false,
    has_wifi: false,
    has_menu: false,
    gallery: [] as string[]
  });
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'place' | 'category' | 'subcategory' | 'commune' | 'media' | 'tour' | 'notification' | 'menu' | 'user', id: string, extraData?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', avatar_url: '' });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    logo_url: '',
    hero_image_url: '',
    hero_title: 'Descubre el mundo',
    contact_email: ''
  });
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    );
  }

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
      ownerId: user.role === 'owner' ? user.id : undefined,
      assignedPlaceId: user.role === 'owner' ? user.assigned_place_id : undefined
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
          if (u.role === 'owner' && u.assigned_place_id) {
            const place = places.find(p => p.id === u.assigned_place_id);
            if (place && place.owner_id !== u.id) {
              console.log(`Fixing owner_id for place ${place.id} to ${u.id}`);
              try {
                await api.updatePlace(token, place.id, { owner_id: u.id });
              } catch (err) {
                console.error(`Failed to fix owner_id for place ${place.id}:`, err);
              }
            }
          }
        }
      };
      fixOwnerIds();
    }
  }, [user, users, places]);

  const handleDeleteMedia = async (item: Media) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      setLoading(true);
      await api.deleteMedia(token, item);
      setMedia(prev => prev.filter(m => m.id !== item.id));
      setSuccess('Imagen eliminada con éxito');
      setConfirmDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Media delete error:", err);
      setError('Error al eliminar imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin');
    } catch (err) {
      console.error("Logout error:", err);
      navigate('/admin');
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
      console.error("Profile update error:", err);
      setError('Error al actualizar perfil');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExportData = () => {
    const data = {
      places,
      categories
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [loading, setLoading] = useState(false);

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
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Error al importar datos. Asegúrate de que el formato sea correcto.');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo.');
    };
    reader.readAsText(file);
  };

  const handleDeletePlace = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) return;
      
      const placeToDelete = places.find(p => p.id === id);
      await api.deletePlace(token, id);
      
      // Clear owner's assigned_place_id
      if (user?.role === 'admin' && placeToDelete?.owner_id) {
        await api.updateUser(placeToDelete.owner_id, { assigned_place_id: null as any });
      }
      
      setConfirmDelete(null);
    } catch (err) {
      console.error("Place delete error:", err);
      setError('Error al eliminar lugar');
    }
  };

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || '';
      const lat = place.geometry?.location?.lat() || 0;
      const lng = place.geometry?.location?.lng() || 0;
      
      setNewPlace(prev => ({
        ...prev,
        address,
        lat,
        lng
      }));
    }
  };

  const handleCommuneChanged = () => {
    if (communeAutocomplete !== null) {
      const place = communeAutocomplete.getPlace();
      const name = place.name || place.formatted_address || '';
      const lat = place.geometry?.location?.lat() || 0;
      const lng = place.geometry?.location?.lng() || 0;
      
      setNewCommune(prev => ({
        ...prev,
        name,
        lat,
        lng
      }));
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validar el origen del mensaje
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'INSTAGRAM_AUTH_SUCCESS') {
        const { placeId, data } = event.data;
        
        // Recargar los datos del lugar para reflejar el estado conectado
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

  const handleConnectInstagram = async (placeId: string | undefined) => {
    if (!placeId) {
      setError('Debes guardar el lugar antes de conectar Instagram');
      return;
    }
    try {
      const response = await fetch(`/api/instagram/auth-url?placeId=${encodeURIComponent(placeId)}`);
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();
      if (url) {
        const authWindow = window.open(url, 'instagram_auth', 'width=600,height=700');
        if (!authWindow) {
          setError('El bloqueador de ventanas emergentes impidió abrir la ventana de autenticación. Por favor, desactívalo y vuelve a intentarlo.');
        }
      }
    } catch (err) {
      setError('Error al conectar con Instagram');
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
      setIsUpdatingUser(userId);
      
      // Get current user data to check for previous assigned_place_id and role
      const currentUser = users.find(u => u.id === userId);
      const previousPlaceId = currentUser?.assigned_place_id;
      const currentRole = 'role' in data ? data.role : currentUser?.role;
      
      // If role is changed away from owner, we should clear the assigned place
      if ('role' in data && data.role !== 'owner' && previousPlaceId) {
        data.assigned_place_id = null as any;
      }

      const currentAssignedPlaceId = 'assigned_place_id' in data ? data.assigned_place_id : previousPlaceId;
      
      await api.updateUser(userId, data);
      
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        // If assigned_place_id is being updated (either explicitly or because role changed)
        if ('assigned_place_id' in data) {
          // If there was a previous place, clear its owner_id
          if (previousPlaceId && previousPlaceId !== data.assigned_place_id) {
            await api.updatePlace(token, previousPlaceId, { owner_id: null });
          }
          
          // If a new place is assigned, set its owner_id (only if the user is an owner)
          if (data.assigned_place_id) {
            await api.updatePlace(token, data.assigned_place_id, { 
              owner_id: currentRole === 'owner' ? userId : null 
            });
          }
        } 
        // If only the role is being updated to owner, and they already had a place
        else if ('role' in data && data.role === 'owner' && currentAssignedPlaceId) {
          await api.updatePlace(token, currentAssignedPlaceId, { owner_id: userId });
        }
      }
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
      toast.success('Usuario actualizado correctamente');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar el usuario');
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      setLoading(true);
      await api.deleteUser(uid);
      setUsers(prev => prev.filter(u => u.id !== uid));
      setSuccess('Usuario eliminado con éxito');
      setConfirmDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("User delete error:", err);
      setError(err.message || 'Error al eliminar usuario');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError('No se pudo obtener el token de autenticación. Por favor, inicia sesión de nuevo.');
        return;
      }

      let owner_id = isOwner ? auth.currentUser?.uid : newPlace.owner_id;

      let placeId = editingPlace?.id;

      if (editingPlace) {
        await api.updatePlace(token, editingPlace.id, { 
          ...newPlace, 
          owner_id,
          gallery: JSON.stringify(newPlace.gallery) 
        });
        
        // Sync user's assigned_place_id
        if (user?.role === 'admin') {
          if (owner_id !== editingPlace.owner_id) {
            // Clear old owner's assigned_place_id
            if (editingPlace.owner_id) {
              await api.updateUser(editingPlace.owner_id, { assigned_place_id: null as any });
            }
          }
          
          // Always ensure the current owner has the assigned_place_id set
          if (owner_id) {
            await api.updateUser(owner_id, { assigned_place_id: editingPlace.id });
          }
        }
        
        setEditingPlace(null);
      } else {
        const placeData = {
          ...newPlace,
          owner_id,
          gallery: JSON.stringify(newPlace.gallery)
        };
        const result = await api.createPlace(token, placeData);
        placeId = result.id;
        
        // Sync user's assigned_place_id
        if (user?.role === 'admin' && owner_id && placeId) {
          await api.updateUser(owner_id, { assigned_place_id: placeId });
        }
      }
      setIsAddingPlace(false);
      resetPlaceForm();
      setSuccess('Lugar guardado con éxito');
    } catch (err) {
      console.error("Place save error:", err);
      let message = 'Error al procesar lugar';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) message += ': ' + parsed.error;
        } catch (e) {
          message += ': ' + err.message;
        }
      }
      setError(message);
    }
  };

  const resetPlaceForm = () => {
    setNewPlace({
      name: '',
      category_id: categories[0]?.id || '',
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
      instagram_access_token: '',
      instagram_user_id: '',
      instagram_username: '',
      instagram_token_expires_at: '',
      gallery: [] as string[]
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'cover' | 'gallery' | 'category' | 'settings' | 'hero' | 'commune' | 'notification' | 'menu' | 'tour' | 'user_profile') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) return;

    setIsUploading(true);
    try {
      if (target === 'gallery') {
        const filesArray = Array.from(files);
        const remainingSlots = 10 - newPlace.gallery.length;
        const filesToUpload = filesArray.slice(0, remainingSlots);

        if (filesArray.length > remainingSlots) {
          setError(`Solo puedes subir hasta 10 imágenes en total. Se han omitido ${filesArray.length - remainingSlots} imágenes.`);
        }

        const uploadResults = await Promise.allSettled(
          filesToUpload.map(async (file) => {
            if (file.size > 5 * 1024 * 1024) {
              throw new Error(`La imagen ${file.name} es demasiado grande (máx 5MB).`);
            }
            try {
              const { url } = await api.uploadImage(token, file);
              return url;
            } catch (err) {
              console.error(`Error al subir ${file.name}:`, err);
              throw new Error(`Error al subir ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
            }
          })
        );
        
        const uploadedUrls = uploadResults
          .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
          .map(result => result.value);
          
        const failedUploads = uploadResults
          .filter((result): result is PromiseRejectedResult => result.status === 'rejected');
          
        if (failedUploads.length > 0) {
          setError(`Se subieron ${uploadedUrls.length} imágenes. Fallaron ${failedUploads.length}: ${failedUploads[0].reason.message}`);
        }
        
        setNewPlace({ ...newPlace, gallery: [...newPlace.gallery, ...uploadedUrls] });
      } else {
        const file = files[0];
        if (file.size > 5 * 1024 * 1024) {
          setError('La imagen es demasiado grande. El tamaño máximo permitido es 5MB.');
          return;
        }
        try {
          const { url } = await api.uploadImage(token, file);
          if (target === 'profile') {
            setNewPlace({ ...newPlace, profile_image_url: url });
          } else if (target === 'cover') {
            setNewPlace({ ...newPlace, cover_image_url: url });
          } else if (target === 'category') {
            setNewCategory({ ...newCategory, image_url: url });
          } else if (target === 'settings') {
            setAppSettings({ ...appSettings, logo_url: url });
          } else if (target === 'hero') {
            setAppSettings({ ...appSettings, hero_image_url: url });
          } else if (target === 'commune') {
            setNewCommune({ ...newCommune, image_url: url });
          } else if (target === 'notification') {
            setNewNotification({ ...newNotification, image_url: url });
          } else if (target === 'menu') {
            setNewMenuItem({ ...newMenuItem, image_url: url });
          } else if (target === 'tour') {
            setNewTour({ ...newTour, image_url: url });
          } else if (target === 'user_profile') {
            setProfileForm({ ...profileForm, avatar_url: url });
          }
        } catch (err) {
          console.error(`Error al subir ${file.name}:`, err);
          throw new Error(`Error al subir ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      setError('Error al subir imagen: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (editingPlace) {
      const unsubTours = api.subscribeToTours(editingPlace.id, setTours);
      const unsubReviews = api.subscribeToReviews(editingPlace.id, setReviews);
      const unsubMenu = api.subscribeToMenuItems(editingPlace.id, setMenuItems);
      return () => {
        unsubTours();
        unsubReviews();
        unsubMenu();
      };
    }
  }, [editingPlace]);

  const startEditPlace = (place: Place) => {
    setEditingPlace(place);
    setNewPlace({
      name: place.name,
      category_id: place.category_id,
      subcategory_id: place.subcategory_id || '',
      full_description: place.full_description || '',
      profile_image_url: place.profile_image_url || '',
      cover_image_url: place.cover_image_url || '',
      address: place.address || '',
      lat: place.lat || 0,
      lng: place.lng || 0,
      phone: place.phone || '',
      whatsapp: place.whatsapp || '',
      website: place.website || '',
      hours: place.hours || '',
      youtube_video_url: place.youtube_video_url || '',
      owner_id: place.owner_id || '',
      slug: place.slug || '',
      is_featured: place.is_featured === 1,
      is_active: place.is_active === 1,
      is_pet_friendly: place.is_pet_friendly || false,
      has_parking: place.has_parking || false,
      has_wifi: place.has_wifi || false,
      has_menu: place.has_menu || false,
      instagram_access_token: place.instagram_access_token || '',
      instagram_user_id: place.instagram_user_id || '',
      instagram_username: place.instagram_username || '',
      instagram_token_expires_at: place.instagram_token_expires_at || '',
      gallery: (() => {
        try {
          return typeof place.gallery === 'string' ? JSON.parse(place.gallery || '[]') : (Array.isArray(place.gallery) ? place.gallery : []);
        } catch (e) {
          return [];
        }
      })()
    });
    
    setIsAddingPlace(true);
    setActiveTab('places');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const editId = params.get('edit');
    if (editId && places.length > 0) {
      const placeToEdit = places.find(p => p.id === editId);
      if (placeToEdit) {
        setActiveTab('places');
        startEditPlace(placeToEdit);
        // Clean up URL
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [routerLocation.search, places, navigate]);

  const handleAddTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      await api.createTour(token, { ...newTour, place_id: editingPlace.id });
      setIsAddingTour(false);
      setNewTour({ name: '', description: '', price: 0, duration: '', image_url: '' });
    } catch (err) {
      console.error("Tour save error:", err);
      setError('Error al añadir tour');
    }
  };

  const handleDeleteTour = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || !editingPlace) return;
      await api.deleteTour(token, id);
      setTours(tours.filter(t => t.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Tour delete error:", err);
      setError('Error al eliminar tour');
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      console.log('Attempting to add/update menu item:', newMenuItem, 'to place:', editingPlace.id);
      
      if (editingMenuItem) {
        await api.updateMenuItem(editingPlace.id, editingMenuItem.id, newMenuItem);
        console.log('Menu item updated successfully');
      } else {
        const result = await api.createMenuItem(editingPlace.id, newMenuItem);
        console.log('Menu item added successfully:', result);
      }
      
      // Ensure the place has has_menu set to true
      if (!editingPlace.has_menu) {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          await api.updatePlace(token, editingPlace.id, { has_menu: true });
          setEditingPlace({ ...editingPlace, has_menu: true });
        }
      }
      
      setIsAddingMenuItem(false);
      setEditingMenuItem(null);
      setNewMenuItem({ 
        name: '', 
        description: '', 
        price: 0, 
        image_url: '', 
        category: '', 
        is_available: true,
        sizes: [],
        addons: []
      });
    } catch (err) {
      console.error('Detailed error adding menu item:', err);
      let message = 'Error al añadir ítem al menú';
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) message += ': ' + parsed.error;
          console.error('Parsed error details:', parsed);
        } catch (e) {
          message += ': ' + err.message;
        }
      }
      setError(message);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || !editingPlace) return;
      await api.deleteMenuItem(editingPlace.id, id);
      
      // If this was the last menu item, update place has_menu to false
      if (menuItems.length <= 1) {
        await api.updatePlace(token, editingPlace.id, { has_menu: false });
        setEditingPlace({ ...editingPlace, has_menu: false });
      }
      
      setConfirmDelete(null);
    } catch (err) {
      console.error("Menu item delete error:", err);
      setError('Error al eliminar ítem del menú');
    }
  };

  const startEditMenuItem = (item: any) => {
    setEditingMenuItem(item);
    setNewMenuItem({
      name: item.name || '',
      description: item.description || '',
      price: item.price || 0,
      image_url: item.image_url || '',
      category: item.category || '',
      is_available: item.is_available !== undefined ? item.is_available : true,
      sizes: item.sizes || [],
      addons: item.addons || []
    });
    setIsAddingMenuItem(true);
  };

  const handleToggleMenuItemAvailability = async (item: any) => {
    if (!editingPlace) return;
    try {
      const newStatus = !item.is_available;
      await api.updateMenuItem(editingPlace.id, item.id, { is_available: newStatus });
      // The subscription will update the list automatically
    } catch (err) {
      setError('Error al cambiar disponibilidad del ítem');
    }
  };

  const handleAddCommune = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      if (editingCommune) {
        await api.updateCommune(editingCommune.id, newCommune);
        setEditingCommune(null);
      } else {
        await api.createCommune(newCommune);
      }
      setIsAddingCommune(false);
      setNewCommune({ name: '', lat: 0, lng: 0, image_url: '' });
      setSuccess('Comuna guardada con éxito');
    } catch (err) {
      console.error("Commune save error:", err);
      setError('Error al procesar comuna');
    }
  };

  const handleDeleteCommune = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await api.deleteCommune(id);
      setConfirmDelete(null);
    } catch (err) {
      console.error("Commune delete error:", err);
      setError('Error al eliminar comuna');
    }
  };

  const handleSaveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNotification) {
        await api.updateNotification(editingNotification.id, newNotification);
        setSuccess('Notificación actualizada con éxito');
      } else {
        await api.createNotification(newNotification);
        setSuccess('Notificación creada con éxito');
      }
      setIsAddingNotification(false);
      setEditingNotification(null);
      setNewNotification({ title: '', message: '', type: 'info', image_url: '', link_url: '', is_active: true });
    } catch (err) {
      setError('Error al guardar notificación');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setConfirmDelete(null);
      setSuccess('Notificación eliminada con éxito');
    } catch (err) {
      setError('Error al eliminar notificación');
    }
  };

  const startEditNotification = (notification: AppNotification) => {
    setEditingNotification(notification);
    setNewNotification({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      image_url: notification.image_url || '',
      link_url: notification.link_url || '',
      is_active: notification.is_active
    });
    setIsAddingNotification(true);
  };

  const startEditCommune = (commune: Commune) => {
    setEditingCommune(commune);
    setNewCommune({ 
      name: commune.name, 
      lat: commune.lat, 
      lng: commune.lng, 
      image_url: commune.image_url || '' 
    });
    setIsAddingCommune(true);
    setActiveTab('communes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Check if slug is already taken by another category
      const slugExists = categories.some(c => c.slug === newCategory.slug && (!editingCategory || c.id !== editingCategory.id));
      if (slugExists) {
        setError('Este slug ya está en uso por otra categoría. Por favor elige uno diferente.');
        return;
      }

      if (editingCategory) {
        await api.updateCategory(token, editingCategory.id, newCategory);
        setEditingCategory(null);
      } else {
        await api.createCategory(token, { ...newCategory, order_index: categories.length });
      }
      setIsAddingCategory(false);
      setNewCategory({ name: '', icon: 'Map', image_url: '', slug: '', order_index: 0 });
      setSuccess('Categoría guardada con éxito');
    } catch (err) {
      console.error("Category save error:", err);
      let message = 'Error al procesar categoría';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) message += ': ' + parsed.error;
        } catch (e) {
          message += ': ' + err.message;
        }
      }
      setError(message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await api.deleteCategory(token, id);
      setConfirmDelete(null);
    } catch (err) {
      console.error("Category delete error:", err);
      setError('Error al eliminar categoría.');
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategory({ name: cat.name, icon: cat.icon, image_url: cat.image_url || '', slug: cat.slug, order_index: cat.order_index || 0 });
    setIsAddingCategory(true);
    setActiveTab('categories');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMoveCategory = async (id: string, direction: 'up' | 'down') => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) return;

    const sorted = [...categories].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const index = sorted.findIndex(c => c.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    const otherCat = sorted[newIndex];
    const currentCat = sorted[index];

    try {
      // Swap order_index
      const tempOrder = currentCat.order_index || 0;
      const targetOrder = otherCat.order_index || 0;

      // If they have the same order (e.g. both 0), we need to fix it
      const finalTargetOrder = targetOrder === tempOrder ? (direction === 'up' ? tempOrder - 1 : tempOrder + 1) : targetOrder;

      await api.updateCategory(token, currentCat.id, { ...currentCat, order_index: finalTargetOrder });
      await api.updateCategory(token, otherCat.id, { ...otherCat, order_index: tempOrder });
    } catch (err) {
      setError('Error al reordenar categorías: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Check if slug is already taken by another subcategory in the same category
      const slugExists = subcategories.some(s => s.category_id === newSubcategory.category_id && s.slug === newSubcategory.slug && (!editingSubcategory || s.id !== editingSubcategory.id));
      if (slugExists) {
        setError('Este slug ya está en uso por otra subcategoría en esta categoría.');
        return;
      }

      if (editingSubcategory) {
        await api.updateSubcategory(token, editingSubcategory.id, newSubcategory);
        setEditingSubcategory(null);
      } else {
        const subCount = subcategories.filter(s => s.category_id === newSubcategory.category_id).length;
        await api.createSubcategory(token, { ...newSubcategory, order_index: subCount });
      }
      setIsAddingSubcategory(false);
      setNewSubcategory({ name: '', category_id: '', slug: '', order_index: 0 });
      setSuccess('Subcategoría guardada con éxito');
    } catch (err) {
      console.error("Subcategory save error:", err);
      setError('Error al guardar subcategoría');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await api.deleteSubcategory(token, id);
      setConfirmDelete(null);
    } catch (err) {
      console.error("Subcategory delete error:", err);
      setError('Error al eliminar subcategoría.');
    }
  };

  const startEditSubcategory = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    setNewSubcategory({ 
      name: sub.name, 
      category_id: sub.category_id,
      slug: sub.slug,
      order_index: sub.order_index || 0
    });
    setIsAddingSubcategory(true);
    setActiveTab('categories');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMoveSubcategory = async (id: string, direction: 'up' | 'down') => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) return;

    const sub = subcategories.find(s => s.id === id);
    if (!sub) return;

    const filteredSubs = subcategories
      .filter(s => s.category_id === sub.category_id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
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

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      setLoading(true);
      await api.updateSettings(token, appSettings);
      setSuccess('Configuración actualizada con éxito');
    } catch (err) {
      console.error("Settings update error:", err);
      let message = 'Error al actualizar configuración';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) message += ': ' + parsed.error;
        } catch (e) {
          message += ': ' + err.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = categories.map(cat => ({
    name: cat.name,
    count: places.filter(p => p.category_id === cat.id).length
  })).filter(d => d.count > 0);

  const COLORS = ['#0d9488', '#0284c7', '#ea580c', '#7c3aed', '#db2777', '#2563eb'];

  const filteredPlaces = places.filter(p => {
    const category = categories.find(c => c.id === p.category_id);
    const searchLower = searchQuery.toLowerCase();
    
    return (
      (p.name || '').toLowerCase().includes(searchLower) ||
      (p.address || '').toLowerCase().includes(searchLower) ||
      (category?.name || '').toLowerCase().includes(searchLower)
    );
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-950 flex flex-col md:flex-row transition-colors duration-300">
      <SEO title="Panel de Administración" noindex />
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-600 dark:bg-sky-500 rounded-lg flex items-center justify-center text-white">
            <Palmtree className="w-5 h-5" />
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 md:w-72 md:h-screen md:sticky md:top-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 h-full flex flex-col overflow-y-auto">
          <div className="hidden md:flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-sky-600 dark:bg-sky-500 rounded-xl flex items-center justify-center text-white">
              <Palmtree className="w-6 h-6" />
            </div>
          </div>

          <nav className="space-y-2" style={{ width: '305.112px' }}>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 px-4">Menú Principal</p>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <Globe className="w-5 h-5" />
              Inicio
            </button>
            <button
              onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('places'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'places' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <MapPin className="w-5 h-5" />
              Lugares
            </button>
            <button
              onClick={() => { setActiveTab('media'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'media' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <ImageIcon className="w-5 h-5" />
              Multimedia
            </button>
            <button
              onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'profile' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <UserIcon className="w-5 h-5" />
              Mi Perfil
            </button>
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Layers className="w-5 h-5" />
                  Categorías
                </button>
                <button
                  onClick={() => { setActiveTab('communes'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'communes' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <MapIcon className="w-5 h-5" />
                  Comunas
                </button>
                <button
                  onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Users className="w-5 h-5" />
                  Usuarios
                </button>
                <button
                  onClick={() => { 
                    setActiveTab('notifications'); 
                    setIsSidebarOpen(false); 
                    markNotificationsAsRead();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'notifications' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5" />
                    Notificaciones
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>

          <div className="mt-12">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 px-4">General</p>
            <nav className="space-y-2">
              {userRole === 'admin' && (
                <>
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Exportar Backup
                  </button>
                  <label className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
                    <UploadCloud className="w-5 h-5" />
                    Importar Datos
                    <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
                  </label>
                  <button 
                    onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Settings className="w-5 h-5" />
                    Ajustes
                  </button>
                </>
              )}
              <button 
                onClick={() => { setActiveTab('help'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'help' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                <HelpCircle className="w-5 h-5" />
                Ayuda
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </nav>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-800">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600">
                {user?.avatar_url ? (
                  <ElegantImage 
                    src={optimizeImageUrl(user.avatar_url, 100)} 
                    alt="" 
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.full_name || 'Usuario'}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar lugares, categorías..." 
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-all font-medium text-gray-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setActiveTab('notifications');
                markNotificationsAsRead();
              }}
              className="w-12 h-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all relative flex-shrink-0"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                if (activeTab === 'categories') setIsAddingCategory(true);
                else if (activeTab === 'communes') setIsAddingCommune(true);
                else {
                  resetPlaceForm();
                  setIsAddingPlace(true);
                  setActiveTab('places');
                }
              }}
              className="flex-grow lg:flex-none bg-sky-600 dark:bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-sky-700 dark:hover:bg-sky-600 transition-all shadow-lg shadow-sky-200 dark:shadow-none"
            >
              <Plus className="w-5 h-5" />
              <span className="whitespace-nowrap">
                {activeTab === 'categories' ? 'Nueva Categoría' : activeTab === 'communes' ? 'Nueva Comuna' : 'Nuevo Lugar'}
              </span>
            </button>
          </div>
        </header>

        {activeTab === 'overview' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Dashboard</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Gestiona, prioriza y analiza tu contenido con facilidad.</p>
              </div>
              {userRole === 'admin' && (
                <label className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 cursor-pointer">
                  Importar Datos
                  <ChevronRight className="w-4 h-4" />
                  <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
                </label>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-sky-600 dark:bg-sky-500 p-8 rounded-[2rem] text-white shadow-xl shadow-sky-200 dark:shadow-none relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-sky-100 dark:text-sky-50 font-bold mb-2">Total Lugares</p>
                  <h3 className="text-5xl font-black mb-4">{places.length}</h3>
                  <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12% este mes</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              </div>

              {userRole === 'admin' ? (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group">
                  <p className="text-gray-400 dark:text-gray-500 font-bold mb-2">Categorías</p>
                  <h3 className="text-5xl font-black text-gray-900 dark:text-white mb-4">{categories.length}</h3>
                  <div className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 w-fit px-3 py-1 rounded-full">
                    <Layers className="w-4 h-4" />
                    <span>Estructura activa</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group">
                  <p className="text-gray-400 dark:text-gray-500 font-bold mb-2">Multimedia</p>
                  <h3 className="text-5xl font-black text-gray-900 dark:text-white mb-4">{media.length}</h3>
                  <div className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 w-fit px-3 py-1 rounded-full">
                    <ImageIcon className="w-4 h-4" />
                    <span>Archivos subidos</span>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group">
                <p className="text-gray-400 dark:text-gray-500 font-bold mb-2">Reseñas Totales</p>
                <h3 className="text-5xl font-black text-gray-900 dark:text-white mb-4">{reviews.length}</h3>
                <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 w-fit px-3 py-1 rounded-full">
                  <Bell className="w-4 h-4" />
                  <span>Feedback activo</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group">
                <p className="text-gray-400 dark:text-gray-500 font-bold mb-2">Lugares Destacados</p>
                <h3 className="text-5xl font-black text-gray-900 dark:text-white mb-4">{places.filter(p => p.is_featured).length}</h3>
                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 w-fit px-3 py-1 rounded-full">
                  <Star className="w-4 h-4" />
                  <span>Premium</span>
                </div>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Distribución por Categoría</h3>
                  <select className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 outline-none">
                    <option>Esta semana</option>
                    <option>Este mes</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-sky-900 dark:bg-sky-950 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                  <h3 className="text-xl font-bold mb-2 relative z-10">Recordatorio</h3>
                  <p className="text-sky-200 dark:text-sky-300 mb-6 relative z-10">Revisión de nuevos locales pendientes de aprobación.</p>
                  <button className="w-full py-4 bg-sky-600 dark:bg-sky-500 rounded-2xl font-bold hover:bg-sky-500 dark:hover:bg-sky-400 transition-all flex items-center justify-center gap-2 relative z-10">
                    <Eye className="w-5 h-5" />
                    Ver Pendientes
                  </button>
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-sky-800 dark:bg-sky-900 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Actividad Reciente</h3>
                    <button className="text-sky-600 dark:text-sky-400 text-sm font-bold">+ Ver Todo</button>
                  </div>
                  <div className="space-y-6">
                    {places.slice(0, 4).map((place, i) => (
                      <div 
                        key={place.id} 
                        className="flex items-center gap-4 group cursor-pointer"
                        onClick={() => {
                          setActiveTab('places');
                          startEditPlace(place);
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        <div className="flex-grow">
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{place.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Actualizado hace {i + 1}h</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('places');
                              startEditPlace(place);
                            }}
                            className="p-2 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'places' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Lugares</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Gestiona los establecimientos y puntos de interés.</p>
              </div>
              {!isAddingPlace && (
                <button 
                  onClick={() => {
                    setEditingPlace(null);
                    resetPlaceForm();
                    setIsAddingPlace(true);
                  }}
                  className="bg-sky-600 dark:bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-sky-700 dark:hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 dark:shadow-none"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Nuevo Lugar</span>
                </button>
              )}
            </div>
            {isAddingPlace && (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-lg border border-sky-100 dark:border-gray-800">
                <h3 className="text-xl font-bold mb-6 dark:text-white">{editingPlace ? 'Editar Lugar' : 'Nuevo Lugar'}</h3>
                <form onSubmit={handleAddPlace} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre del Lugar</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                      value={newPlace.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase()
                          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                          .replace(/[^a-z0-9]/g, '-')
                          .replace(/-+/g, '-')
                          .replace(/^-|-$/g, '');
                        setNewPlace({ ...newPlace, name, slug });
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Enlace Amigable (Slug)</label>
                    <div className="flex gap-2">
                      <span className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl text-gray-500 dark:text-gray-400 text-sm flex items-center">/lugar/</span>
                      <input
                        type="text"
                        required
                        placeholder="nombre-del-local"
                        className="flex-grow p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                        value={newPlace.slug}
                        onChange={(e) => setNewPlace({ ...newPlace, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
                    <select
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                      value={newPlace.category_id}
                      onChange={(e) => setNewPlace({ ...newPlace, category_id: e.target.value, subcategory_id: '' })}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subcategoría (Opcional)</label>
                    <select
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none disabled:opacity-50"
                      value={newPlace.subcategory_id}
                      onChange={(e) => setNewPlace({ ...newPlace, subcategory_id: e.target.value })}
                      disabled={!newPlace.category_id}
                    >
                      <option value="">Ninguna</option>
                      {subcategories
                        .filter(s => s.category_id === newPlace.category_id)
                        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Imagen de Perfil (Logo)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="URL de la imagen de perfil"
                        className="flex-grow p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                        value={newPlace.profile_image_url}
                        onChange={(e) => setNewPlace({ ...newPlace, profile_image_url: e.target.value })}
                      />
                      <label className="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 p-3 rounded-xl cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-all flex items-center justify-center min-w-[50px]">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} disabled={isUploading} />
                      </label>
                    </div>
                    {newPlace.profile_image_url && (
                      <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                        <ElegantImage 
                          src={optimizeImageUrl(newPlace.profile_image_url, 160)} 
                          alt="Profile Preview" 
                          className="w-full h-full object-cover" 
                          containerClassName="w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Imagen de Portada</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="URL de la imagen de portada"
                        className="flex-grow p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                        value={newPlace.cover_image_url}
                        onChange={(e) => setNewPlace({ ...newPlace, cover_image_url: e.target.value })}
                      />
                      <label className="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 p-3 rounded-xl cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-all flex items-center justify-center min-w-[50px]">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} disabled={isUploading} />
                      </label>
                    </div>
                    {newPlace.cover_image_url && (
                      <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                        <ElegantImage 
                          src={optimizeImageUrl(newPlace.cover_image_url, 400)} 
                          alt="Cover Preview" 
                          className="w-full h-full object-cover" 
                          containerClassName="w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Galería de Imágenes</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                      {newPlace.gallery.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                          <ElegantImage 
                            src={optimizeImageUrl(url, 200)} 
                            alt={`Gallery ${idx}`} 
                            className="w-full h-full object-cover" 
                            containerClassName="w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => setNewPlace({ ...newPlace, gallery: newPlace.gallery.filter((_, i) => i !== idx) })}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-sky-300 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all text-gray-400 dark:text-gray-500 hover:text-sky-600 dark:hover:text-sky-400">
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                        <span className="text-[10px] font-bold">Subir</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} disabled={isUploading || newPlace.gallery.length >= 10} />
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descripción del Local</label>
                    <textarea
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none h-32"
                      value={newPlace.full_description}
                      onChange={(e) => setNewPlace({ ...newPlace, full_description: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dirección</label>
                    {isLoaded ? (
                      <Autocomplete
                        onLoad={setAutocomplete}
                        onPlaceChanged={handlePlaceChanged}
                      >
                        <input
                          type="text"
                          placeholder="Busca una dirección..."
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                          value={newPlace.address}
                          onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                        value={newPlace.address}
                        onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                      />
                    )}
                    <div className="mt-2 flex gap-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
                      <span>Lat: {newPlace.lat?.toFixed(6) || '0.000000'}</span>
                      <span>Lng: {newPlace.lng?.toFixed(6) || '0.000000'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Horarios</label>
                    <input
                      type="text"
                      placeholder="Ej: Lun-Vie 9:00 - 18:00"
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                      value={newPlace.hours}
                      onChange={(e) => setNewPlace({ ...newPlace, hours: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Teléfono</label>
                    <input
                      type="text"
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                      value={newPlace.phone}
                      onChange={(e) => setNewPlace({ ...newPlace, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">WhatsApp</label>
                    <input
                      type="text"
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                      value={newPlace.whatsapp}
                      onChange={(e) => setNewPlace({ ...newPlace, whatsapp: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Enlace Video YouTube (Shorts)</label>
                    <input
                      type="text"
                      placeholder="Ej: https://youtube.com/shorts/..."
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 outline-none"
                      value={newPlace.youtube_video_url}
                      onChange={(e) => setNewPlace({ ...newPlace, youtube_video_url: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-8 py-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-600 dark:accent-emerald-500"
                        checked={newPlace.is_pet_friendly}
                        onChange={(e) => setNewPlace({ ...newPlace, is_pet_friendly: e.target.checked })}
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">Mascotas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-600 dark:accent-emerald-500"
                        checked={newPlace.has_parking}
                        onChange={(e) => setNewPlace({ ...newPlace, has_parking: e.target.checked })}
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">Estac.</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-600 dark:accent-emerald-500"
                        checked={newPlace.has_wifi}
                        onChange={(e) => setNewPlace({ ...newPlace, has_wifi: e.target.checked })}
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">Wi-Fi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-600 dark:accent-emerald-500"
                        checked={newPlace.has_menu}
                        onChange={(e) => setNewPlace({ ...newPlace, has_menu: e.target.checked })}
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">Menú</span>
                    </label>
                  </div>

                  <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg text-white">
                          <Instagram className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">Instagram Feed</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Muestra tus últimas publicaciones en tu perfil</p>
                        </div>
                      </div>
                      {!newPlace.instagram_access_token ? (
                        <button
                          type="button"
                          onClick={() => handleConnectInstagram(newPlace.id || editingPlace?.id)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-pink-500/20 transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Conectar Instagram
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Conectado
                          </span>
                          <button
                            type="button"
                            onClick={() => handleConnectInstagram(newPlace.id)}
                            className="p-2 text-gray-400 hover:text-sky-500 transition-colors"
                            title="Reconectar / Actualizar"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewPlace({ 
                              ...newPlace, 
                              instagram_access_token: '', 
                              instagram_user_id: '', 
                              instagram_username: '',
                              instagram_token_expires_at: ''
                            })}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Desconectar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {newPlace.instagram_access_token && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                        <div className="flex justify-between">
                          <span>User ID:</span>
                          <span className="font-mono">{newPlace.instagram_user_id}</span>
                        </div>
                        {newPlace.instagram_token_expires_at && !isNaN(new Date(newPlace.instagram_token_expires_at).getTime()) && (
                          <div className="flex justify-between">
                            <span>Expira el:</span>
                            <span>{new Date(newPlace.instagram_token_expires_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-8 py-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-sky-600 dark:accent-sky-500"
                        checked={!!newPlace.is_featured}
                        onChange={(e) => setNewPlace({ ...newPlace, is_featured: e.target.checked })}
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">Destacado</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-sky-600 dark:accent-sky-500"
                        checked={!!newPlace.is_active}
                        onChange={(e) => setNewPlace({ ...newPlace, is_active: e.target.checked })}
                      />
                      <span className="font-bold text-gray-700 dark:text-gray-300">Activo</span>
                    </label>
                  </div>

                  {editingPlace && (
                    <div className="md:col-span-2 space-y-8 mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-xl font-black text-gray-900 dark:text-white">Menú del Local</h4>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingMenuItem(!isAddingMenuItem);
                              if (isAddingMenuItem) setEditingMenuItem(null);
                            }}
                            className="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                          >
                            {isAddingMenuItem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isAddingMenuItem ? 'Cancelar' : 'Añadir Ítem'}
                          </button>
                        </div>

                        {isAddingMenuItem && (
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl mb-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Nombre del plato/bebida</label>
                                <input
                                  type="text"
                                  placeholder="Ej: Pizza Margarita"
                                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                  value={newMenuItem.name}
                                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Descripción</label>
                                <textarea
                                  placeholder="Ingredientes, preparación..."
                                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none h-24"
                                  value={newMenuItem.description}
                                  onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Precio Base</label>
                                <input
                                  type="number"
                                  placeholder="Ej: 8500"
                                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                  value={newMenuItem.price}
                                  onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Categoría del Menú</label>
                                <input
                                  type="text"
                                  placeholder="Ej: Pizzas, Bebidas, Postres"
                                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                  value={newMenuItem.category}
                                  onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Imagen del Plato</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="URL de la imagen"
                                    className="flex-grow p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                    value={newMenuItem.image_url}
                                    onChange={(e) => setNewMenuItem({ ...newMenuItem, image_url: e.target.value })}
                                  />
                                  <label className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl cursor-pointer">
                                    <Upload className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'menu')} disabled={isUploading} />
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Sizes Management */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-bold text-gray-900 dark:text-white">Tamaños / Porciones</h5>
                                <button
                                  type="button"
                                  onClick={() => setNewMenuItem({
                                    ...newMenuItem,
                                    sizes: [...newMenuItem.sizes, { name: '', price: 0 }]
                                  })}
                                  className="text-xs font-bold text-sky-500 hover:underline"
                                >
                                  + Añadir Tamaño
                                </button>
                              </div>
                              <div className="space-y-2">
                                {newMenuItem.sizes.map((size, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Nombre (ej: Familiar)"
                                      className="flex-grow p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
                                      value={size.name}
                                      onChange={(e) => {
                                        const updated = [...newMenuItem.sizes];
                                        updated[idx].name = e.target.value;
                                        setNewMenuItem({ ...newMenuItem, sizes: updated });
                                      }}
                                    />
                                    <input
                                      type="number"
                                      placeholder="Precio"
                                      className="w-24 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
                                      value={size.price}
                                      onChange={(e) => {
                                        const updated = [...newMenuItem.sizes];
                                        updated[idx].price = parseFloat(e.target.value) || 0;
                                        setNewMenuItem({ ...newMenuItem, sizes: updated });
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setNewMenuItem({
                                        ...newMenuItem,
                                        sizes: newMenuItem.sizes.filter((_, i) => i !== idx)
                                      })}
                                      className="p-2 text-gray-400 hover:text-red-500"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Addons Management */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-bold text-gray-900 dark:text-white">Agregados / Extras</h5>
                                <button
                                  type="button"
                                  onClick={() => setNewMenuItem({
                                    ...newMenuItem,
                                    addons: [...newMenuItem.addons, { name: '', price: 0 }]
                                  })}
                                  className="text-xs font-bold text-sky-500 hover:underline"
                                >
                                  + Añadir Agregado
                                </button>
                              </div>
                              <div className="space-y-2">
                                {newMenuItem.addons.map((addon, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Nombre (ej: Queso extra)"
                                      className="flex-grow p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
                                      value={addon.name}
                                      onChange={(e) => {
                                        const updated = [...newMenuItem.addons];
                                        updated[idx].name = e.target.value;
                                        setNewMenuItem({ ...newMenuItem, addons: updated });
                                      }}
                                    />
                                    <input
                                      type="number"
                                      placeholder="Precio"
                                      className="w-24 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
                                      value={addon.price}
                                      onChange={(e) => {
                                        const updated = [...newMenuItem.addons];
                                        updated[idx].price = parseFloat(e.target.value) || 0;
                                        setNewMenuItem({ ...newMenuItem, addons: updated });
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setNewMenuItem({
                                        ...newMenuItem,
                                        addons: newMenuItem.addons.filter((_, i) => i !== idx)
                                      })}
                                      className="p-2 text-gray-400 hover:text-red-500"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleAddMenuItem}
                              className="w-full py-3 bg-sky-600 dark:bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-700 dark:hover:bg-sky-600 transition-all"
                            >
                              {editingMenuItem ? 'Actualizar Ítem' : 'Guardar Ítem'}
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {menuItems.map((item) => (
                            <div key={item.id} className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-2xl flex items-center gap-4 shadow-sm group transition-all ${!item.is_available ? 'opacity-60' : ''}`}>
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
                                <ElegantImage 
                                  src={optimizeImageUrl(item.image_url || 'https://picsum.photos/seed/food/100/100', 100)} 
                                  alt="" 
                                  className={`w-full h-full object-cover ${!item.is_available ? 'grayscale' : ''}`} 
                                  containerClassName="w-full h-full"
                                />
                                {!item.is_available && (
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <EyeOff className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className={`font-bold text-gray-900 dark:text-white truncate ${!item.is_available ? 'line-through' : ''}`}>{item.name}</p>
                                <p className="text-xs text-sky-600 dark:text-sky-400 font-bold">${item.price.toLocaleString('es-CL')} • {item.category || 'Sin categoría'}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMenuItemAvailability(item)}
                                  title={item.is_available ? 'Desactivar' : 'Activar'}
                                  className={`p-2 rounded-lg transition-all ${item.is_available ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-500/10'}`}
                                >
                                  {item.is_available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditMenuItem(item)}
                                  className="p-2 text-gray-300 dark:text-gray-500 hover:text-sky-500 dark:hover:text-sky-400 transition-all"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDelete({ type: 'menu', id: item.id })}
                                  className="p-2 text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-xl font-black text-gray-900 dark:text-white">Tours y Experiencias</h4>
                          <button
                            type="button"
                            onClick={() => setIsAddingTour(!isAddingTour)}
                            className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                          >
                            {isAddingTour ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isAddingTour ? 'Cancelar' : 'Añadir Tour'}
                          </button>
                        </div>

                        {isAddingTour && (
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl mb-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="Nombre del tour"
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                value={newTour.name}
                                onChange={(e) => setNewTour({ ...newTour, name: e.target.value })}
                              />
                              <input
                                type="text"
                                placeholder="Precio (ej: 25000)"
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                value={newTour.price}
                                onChange={(e) => setNewTour({ ...newTour, price: parseFloat(e.target.value) || 0 })}
                              />
                              <input
                                type="text"
                                placeholder="Duración (ej: 2 horas)"
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                value={newTour.duration}
                                onChange={(e) => setNewTour({ ...newTour, duration: e.target.value })}
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="URL de imagen"
                                  className="flex-grow p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                  value={newTour.image_url}
                                  onChange={(e) => setNewTour({ ...newTour, image_url: e.target.value })}
                                />
                                <label className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl cursor-pointer">
                                  <Upload className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'tour')} disabled={isUploading} />
                                </label>
                              </div>
                            </div>
                            <textarea
                              placeholder="Descripción del tour"
                              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none h-24"
                              value={newTour.description}
                              onChange={(e) => setNewTour({ ...newTour, description: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={handleAddTour}
                              className="w-full bg-teal-600 dark:bg-teal-500 text-white py-3 rounded-xl font-bold"
                            >
                              Guardar Tour
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {tours.map((tour) => (
                            <div key={tour.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                              <ElegantImage 
                                src={optimizeImageUrl(tour.image_url || 'https://picsum.photos/seed/tour/100/100', 100)} 
                                alt="" 
                                className="w-16 h-16 rounded-xl object-cover" 
                                containerClassName="w-16 h-16 rounded-xl overflow-hidden"
                              />
                              <div className="flex-grow">
                                <p className="font-bold text-gray-900 dark:text-white">{tour.name}</p>
                                <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">${tour.price} • {tour.duration}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete({ type: 'tour', id: tour.id })}
                                className="p-2 text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xl font-black text-gray-900 dark:text-white mb-6">Reseñas de Clientes</h4>
                        <div className="space-y-4">
                          {reviews.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 text-sm italic">No hay reseñas todavía.</p>
                          ) : (
                            reviews.map((review) => (
                              <div key={review.id} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                    {review.user_avatar ? (
                                      <ElegantImage 
                                        src={optimizeImageUrl(review.user_avatar, 64)} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                        containerClassName="w-full h-full"
                                      />
                                    ) : (
                                      <UserIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{review.user_name}</p>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 flex gap-4 mt-8">
                    <button type="submit" className="bg-sky-600 dark:bg-sky-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-sky-700 dark:hover:bg-sky-600 transition-all">
                      {editingPlace ? 'Actualizar' : 'Guardar'} Lugar
                    </button>
                    <button type="button" onClick={() => { setIsAddingPlace(false); setEditingPlace(null); resetPlaceForm(); }} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-8 py-6 font-bold text-gray-700 dark:text-gray-300">Lugar</th>
                      <th className="px-8 py-6 font-bold text-gray-700 dark:text-gray-300">Categoría</th>
                      <th className="px-8 py-6 font-bold text-gray-700 dark:text-gray-300">Estado</th>
                      <th className="px-8 py-6 font-bold text-gray-700 dark:text-gray-300 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredPlaces.map((place) => (
                      <tr key={place.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <ElegantImage
                              src={optimizeImageUrl(place.profile_image_url || `https://picsum.photos/seed/${place.id}/100/100`, 100)}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover shadow-sm"
                              containerClassName="w-12 h-12 rounded-xl overflow-hidden"
                            />
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{place.name}</div>
                              <div className="text-gray-400 dark:text-gray-500 text-xs font-medium">{place.address}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="px-3 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-black rounded-full uppercase tracking-wider w-fit">
                              {categories.find(c => c.id === place.category_id)?.name || 'Sin Categoría'}
                            </span>
                            {place.subcategory_id && (
                              <span className="px-3 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[9px] font-bold rounded-full uppercase tracking-wider w-fit">
                                {subcategories.find(s => s.id === place.subcategory_id)?.name || 'Sin Subcategoría'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {(place.is_featured === 1 || place.is_featured === true) && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                            {place.is_pet_friendly && (
                              <Dog className="w-4 h-4 text-emerald-500" />
                            )}
                            {place.has_parking && (
                              <ParkingCircle className="w-4 h-4 text-blue-500" />
                            )}
                            {place.has_wifi && (
                              <Wifi className="w-4 h-4 text-indigo-500" />
                            )}
                            {(place.is_active === 1 || place.is_active === true) ? (
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Visible
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs font-bold">
                                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                                Oculto
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => startEditPlace(place)}
                              className="p-2 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all"
                              title="Editar"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setConfirmDelete({ type: 'place', id: place.id })}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPlaces.map((place) => (
                  <div key={place.id} className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <ElegantImage
                        src={optimizeImageUrl(place.profile_image_url || `https://picsum.photos/seed/${place.id}/100/100`, 160)}
                        alt=""
                        className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                        containerClassName="w-16 h-16 rounded-2xl overflow-hidden"
                      />
                      <div className="flex-grow">
                        <div className="font-bold text-gray-900 dark:text-white">{place.name}</div>
                        <div className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider flex flex-wrap gap-2 mt-1">
                          <span className="text-teal-600 dark:text-teal-400">{categories.find(c => c.id === place.category_id)?.name || 'Sin Categoría'}</span>
                          {place.subcategory_id && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-sky-600 dark:text-sky-400">{subcategories.find(s => s.id === place.subcategory_id)?.name || 'Sin Subcategoría'}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {place.is_active === 1 ? (
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">Activo</span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">Oculto</span>
                          )}
                          {place.is_featured === 1 && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEditPlace(place)}
                        className="flex-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ type: 'place', id: place.id })}
                        className="flex-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'profile' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Mi Perfil</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Gestiona tu información personal y de contacto.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                      {profileForm.avatar_url ? (
                        <ElegantImage 
                          src={optimizeImageUrl(profileForm.avatar_url, 160)} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                          containerClassName="w-full h-full"
                        />
                      ) : (
                        <UserIcon className="w-16 h-16 text-gray-300 dark:text-gray-500" />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 bg-teal-600 dark:bg-teal-500 p-3 rounded-2xl text-white cursor-pointer hover:bg-teal-700 dark:hover:bg-teal-600 transition-all shadow-lg">
                      <Upload className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'user_profile')} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none font-medium text-gray-900 dark:text-white"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none font-medium text-gray-900 dark:text-white"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Rol</label>
                    <input
                      type="text"
                      disabled
                      className="w-full p-4 bg-gray-100 dark:bg-gray-700 border-none rounded-2xl text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs"
                      value={user?.role === 'admin' ? 'Administrador' : 'Dueño de Local'}
                    />
                  </div>
                  {user?.role === 'owner' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Local Asignado</label>
                      <input
                        type="text"
                        disabled
                        className="w-full p-4 bg-gray-100 dark:bg-gray-700 border-none rounded-2xl text-gray-500 dark:text-gray-400 font-bold"
                        value={places.find(p => p.id === user.assigned_place_id)?.name || 'Ninguno'}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-600 dark:bg-teal-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-all shadow-xl shadow-teal-100 dark:shadow-none"
                >
                  Guardar Cambios
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === 'help' ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Ayuda y Soporte</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">¿Necesitas ayuda con la plataforma? Estamos aquí para asistirte.</p>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <p className="font-bold text-gray-900 dark:text-white mb-1">¿Cómo añado un nuevo lugar?</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Ve a la pestaña "Lugares" y haz clic en "Nuevo Lugar". Completa la información y guarda.</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <p className="font-bold text-gray-900 dark:text-white mb-1">¿Cómo cambio mi contraseña?</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Por ahora, contacta al administrador central para cambios de seguridad.</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Categorías</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Organiza tus lugares por temáticas.</p>
            </div>
            {isAddingCategory && (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-lg border border-teal-100 dark:border-teal-900/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Icono (Lucide Name)</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Slug</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none"
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Imagen de Categoría (Opcional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="URL de la imagen"
                        className="flex-grow p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none"
                        value={newCategory.image_url}
                        onChange={(e) => setNewCategory({ ...newCategory, image_url: e.target.value })}
                      />
                      <label className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 p-3 rounded-xl cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-all flex items-center justify-center min-w-[50px]">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'category')} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <button type="submit" className="bg-teal-600 dark:bg-teal-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 dark:hover:bg-teal-600 transition-all">
                      {editingCategory ? 'Actualizar' : 'Guardar'} Categoría
                    </button>
                    <button type="button" onClick={() => { setIsAddingCategory(false); setEditingCategory(null); setNewCategory({ name: '', icon: 'Map', image_url: '', slug: '', order_index: 0 }); }} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isAddingSubcategory && (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-lg border border-sky-100 dark:border-sky-900/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{editingSubcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría'}</h3>
                <form onSubmit={handleAddSubcategory} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Categoría Padre</label>
                    <select
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                      value={newSubcategory.category_id}
                      onChange={(e) => setNewSubcategory({ ...newSubcategory, category_id: e.target.value })}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                      value={newSubcategory.name}
                      onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Slug</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                      value={newSubcategory.slug}
                      onChange={(e) => setNewSubcategory({ ...newSubcategory, slug: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <button type="submit" className="bg-sky-600 dark:bg-sky-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-sky-700 transition-all">
                      {editingSubcategory ? 'Actualizar' : 'Guardar'} Subcategoría
                    </button>
                    <button type="button" onClick={() => { setIsAddingSubcategory(false); setEditingSubcategory(null); setNewSubcategory({ name: '', category_id: '', slug: '', order_index: 0 }); }} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...categories].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((cat, index, array) => {
                const icons: { [key: string]: any } = {
                  PalmTree: Palmtree,
                  Map: MapIcon,
                  Hotel: Hotel,
                  Utensils: Utensils,
                  Theater: Globe,
                  Trees: Globe
                };
                const Icon = icons[cat.icon] || MapIcon;
                
                return (
                  <div key={cat.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-teal-200 dark:hover:border-teal-900 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => handleMoveCategory(cat.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-300 dark:text-gray-600 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-0 transition-all"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleMoveCategory(cat.id, 'down')}
                            disabled={index === array.length - 1}
                            className="p-1 text-gray-300 dark:text-gray-600 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-0 transition-all"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="w-14 h-14 bg-teal-50 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 dark:group-hover:bg-teal-500 group-hover:text-white transition-all">
                          <Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-lg">{cat.name}</div>
                          <div className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest">{cat.slug}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => startEditCategory(cat)}
                          className="p-2 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete({ type: 'category', id: cat.id })}
                          className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-sky-500" />
                          Subcategorías
                        </h4>
                        <button
                          onClick={() => {
                            setNewSubcategory({ name: '', category_id: cat.id, slug: '', order_index: 0 });
                            setIsAddingSubcategory(true);
                          }}
                          className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Añadir
                        </button>
                      </div>
                      <div className="space-y-2">
                        {subcategories
                          .filter(s => s.category_id === cat.id)
                          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                          .map((sub, subIdx, subArray) => (
                            <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group/sub">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <button
                                    onClick={() => handleMoveSubcategory(sub.id, 'up')}
                                    disabled={subIdx === 0}
                                    className="text-gray-300 dark:text-gray-600 hover:text-sky-500 disabled:opacity-0"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveSubcategory(sub.id, 'down')}
                                    disabled={subIdx === subArray.length - 1}
                                    className="text-gray-300 dark:text-gray-600 hover:text-sky-500 disabled:opacity-0"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sub.name}</span>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditSubcategory(sub)}
                                  className="p-1 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setConfirmDelete({ type: 'subcategory', id: sub.id })}
                                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {subcategories.filter(s => s.category_id === cat.id).length === 0 && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 italic text-center py-2">Sin subcategorías</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'communes' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Comunas</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Personaliza las imágenes y ubicaciones de las comunas.</p>
              </div>
              <button
                onClick={() => setIsAddingCommune(true)}
                className="bg-sky-600 dark:bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-sky-700 dark:hover:bg-sky-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                Nueva Comuna
              </button>
            </div>

            {isAddingCommune && (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-lg border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">
                  {editingCommune ? 'Editar Comuna' : 'Nueva Comuna'}
                </h3>
                <form onSubmit={handleAddCommune} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre de la Comuna (Buscar en Google Maps)</label>
                    {isLoaded ? (
                      <Autocomplete
                        onLoad={setCommuneAutocomplete}
                        onPlaceChanged={handleCommuneChanged}
                      >
                        <input
                          type="text"
                          required
                          placeholder="Busca una comuna..."
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                          value={newCommune.name}
                          onChange={(e) => setNewCommune({ ...newCommune, name: e.target.value })}
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        type="text"
                        required
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                        value={newCommune.name}
                        onChange={(e) => setNewCommune({ ...newCommune, name: e.target.value })}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                      value={newCommune.lat}
                      onChange={(e) => setNewCommune({ ...newCommune, lat: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                      value={newCommune.lng}
                      onChange={(e) => setNewCommune({ ...newCommune, lng: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Imagen de Fondo</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="URL de la imagen"
                        className="flex-grow p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                        value={newCommune.image_url}
                        onChange={(e) => setNewCommune({ ...newCommune, image_url: e.target.value })}
                      />
                      <label className="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 p-3 rounded-xl cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-all flex items-center justify-center min-w-[50px]">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'commune')} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <button type="submit" className="bg-sky-600 dark:bg-sky-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-sky-700 transition-all">
                      {editingCommune ? 'Actualizar' : 'Guardar'} Comuna
                    </button>
                    <button type="button" onClick={() => { setIsAddingCommune(false); setEditingCommune(null); setNewCommune({ name: '', lat: 0, lng: 0, image_url: '' }); }} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communes.map((commune) => (
                <div key={commune.id} className="bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm group hover:shadow-xl transition-all">
                  <div className="h-40 relative overflow-hidden">
                    <ElegantImage 
                      src={optimizeImageUrl(commune.image_url, 400)} 
                      alt={commune.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                      <h3 className="text-white font-black text-xl">{commune.name}</h3>
                    </div>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {commune.lat.toFixed(4)}, {commune.lng.toFixed(4)}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEditCommune(commune)}
                        className="p-2 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ type: 'commune', id: commune.id })}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'notifications' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Notificaciones</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Gestiona las alertas y ofertas que ven los usuarios registrados.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddingNotification(true);
                  setEditingNotification(null);
                  setNewNotification({ title: '', message: '', type: 'info', image_url: '', link_url: '', is_active: true });
                }}
                className="bg-sky-600 dark:bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-sky-700 dark:hover:bg-sky-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                Nueva Notificación
              </button>
            </div>

            {isAddingNotification && (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-lg border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">
                  {editingNotification ? 'Editar Notificación' : 'Nueva Notificación'}
                </h3>
                <form onSubmit={handleSaveNotification} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Título</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                        value={newNotification.title}
                        onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                        placeholder="Ej: ¡Oferta Imperdible!"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                      <select
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                        value={newNotification.type}
                        onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                      >
                        <option value="info">Información (Azul)</option>
                        <option value="success">Éxito (Verde)</option>
                        <option value="warning">Advertencia (Amarillo)</option>
                        <option value="error">Error (Rojo)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Imagen (Opcional)</label>
                    <div className="flex items-center gap-4">
                      {newNotification.image_url && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                          <ElegantImage 
                            src={optimizeImageUrl(newNotification.image_url, 160)} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            containerClassName="w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => setNewNotification({ ...newNotification, image_url: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-sky-500 dark:hover:border-sky-400 transition-all cursor-pointer group">
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-sky-500 transition-colors" />
                            <span className="text-xs font-bold text-gray-400 group-hover:text-sky-500 transition-colors mt-2">Subir Imagen</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'notification')}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Link de la Oferta (Opcional)</label>
                    <input
                      type="url"
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                      value={newNotification.link_url || ''}
                      onChange={(e) => setNewNotification({ ...newNotification, link_url: e.target.value })}
                      placeholder="https://ejemplo.com/oferta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mensaje</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                      placeholder="Escribe aquí el contenido de la notificación u oferta..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      className="w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      checked={newNotification.is_active}
                      onChange={(e) => setNewNotification({ ...newNotification, is_active: e.target.checked })}
                    />
                    <label htmlFor="is_active" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Notificación Activa (Visible para usuarios)
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="bg-sky-600 dark:bg-sky-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-sky-700 transition-all">
                      {editingNotification ? 'Actualizar' : 'Guardar'} Notificación
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAddingNotification(false);
                        setEditingNotification(null);
                      }}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {notifications.map((notification) => (
                <div key={notification.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${
                        notification.type === 'success' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' :
                        notification.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                        notification.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                        'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      }`}>
                        {notification.image_url ? (
                          <ElegantImage 
                            src={optimizeImageUrl(notification.image_url, 100)} 
                            alt="" 
                            className="w-12 h-12 object-cover rounded-xl" 
                            containerClassName="w-12 h-12 rounded-xl overflow-hidden"
                          />
                        ) : (
                          <Bell className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-black text-gray-900 dark:text-white">{notification.title}</h3>
                          {!notification.is_active && (
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Inactiva</span>
                          )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium line-clamp-2">{notification.message}</p>
                        {notification.created_at && !isNaN(new Date(notification.created_at).getTime()) && (
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">
                            Creada el: {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startEditNotification(notification)}
                        className="p-2 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ type: 'notification' as any, id: notification.id })}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Gestión de Usuarios</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Administra los roles de los usuarios y asigna lugares para su gestión.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Usuario</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rol</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Lugar Asignado</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold">
                              {u.full_name?.charAt(0) || u.username?.charAt(0) || u.email?.charAt(0) || '?'}
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{u.full_name || u.username || 'Sin nombre'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                        <td className="px-6 py-4">
                          <select
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none disabled:opacity-50"
                            value={u.role}
                            disabled={isUpdatingUser === u.id || u.id === user?.id}
                            onChange={(e) => handleUpdateUser(u.id, { role: e.target.value as any })}
                          >
                            <option value="user">Usuario</option>
                            <option value="owner">Dueño de Local</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none disabled:opacity-50 w-full max-w-[200px]"
                            value={u.assigned_place_id || ''}
                            disabled={isUpdatingUser === u.id || u.role !== 'owner'}
                            onChange={(e) => handleUpdateUser(u.id, { assigned_place_id: e.target.value || null })}
                          >
                            <option value="">Ninguno</option>
                            {places.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setConfirmDelete({ type: 'user', id: u.id, extraData: u })}
                            disabled={u.id === user?.id}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'media' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Multimedia</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Gestiona todas las imágenes subidas a la plataforma.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-sky-500" />
                  <span className="font-bold text-gray-700 dark:text-gray-300">{media.length} Archivos</span>
                </div>
                <label className="bg-sky-600 dark:bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-sky-700 dark:hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 dark:shadow-none cursor-pointer">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <span>Subir Imagen</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} disabled={isUploading} />
                </label>
              </div>
            </div>

            {media.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-12 rounded-[2rem] shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay archivos multimedia</h3>
                <p className="text-gray-500 dark:text-gray-400">Las imágenes que subas al crear lugares o categorías aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {media.map((item) => (
                  <div key={item.id} className="group relative bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
                      <ElegantImage 
                        src={optimizeImageUrl(item.url, 300)} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        containerClassName="w-full h-full"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate mb-1" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          {(item.size / 1024).toFixed(1)} KB
                        </span>
                        <button 
                          onClick={() => setConfirmDelete({ type: 'media', id: item.id, extraData: item })}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-600 dark:text-gray-300 rounded-xl shadow-lg hover:text-sky-600 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Configuración</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Personaliza la apariencia y datos globales de tu aplicación.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-lg border border-gray-100 dark:border-gray-700">
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Logo de la Aplicación</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                        {appSettings.logo_url ? (
                          <ElegantImage 
                            src={optimizeImageUrl(appSettings.logo_url, 160)} 
                            alt="Logo" 
                            className="w-full h-full object-contain" 
                            containerClassName="w-full h-full"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="URL del logo"
                            className="flex-grow p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none"
                            value={appSettings.logo_url || ''}
                            onChange={(e) => setAppSettings({ ...appSettings, logo_url: e.target.value })}
                          />
                          <label className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 p-3 rounded-xl cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-all flex items-center justify-center min-w-[50px]">
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'settings')} disabled={isUploading} />
                          </label>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Se recomienda un logo en formato PNG o SVG con fondo transparente.</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Imagen de Fondo (Header)</label>
                    <div className="flex items-center gap-6">
                      <div className="w-40 h-24 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                        {appSettings.hero_image_url ? (
                          <ElegantImage 
                            src={optimizeImageUrl(appSettings.hero_image_url, 400)} 
                            alt="Hero" 
                            className="w-full h-full object-cover" 
                            containerClassName="w-full h-full"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="URL de la imagen de fondo"
                            className="flex-grow p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none"
                            value={appSettings.hero_image_url || ''}
                            onChange={(e) => setAppSettings({ ...appSettings, hero_image_url: e.target.value })}
                          />
                          <label className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 p-3 rounded-xl cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-all flex items-center justify-center min-w-[50px]">
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} disabled={isUploading} />
                          </label>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Esta imagen aparecerá como fondo en la sección principal de la página de inicio.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Título Principal (Header)</label>
                    <input
                      type="text"
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none"
                      value={appSettings.hero_title || ''}
                      onChange={(e) => setAppSettings({ ...appSettings, hero_title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email de Contacto</label>
                    <input
                      type="email"
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 outline-none"
                      value={appSettings.contact_email || ''}
                      onChange={(e) => setAppSettings({ ...appSettings, contact_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-teal-600 dark:bg-teal-500 text-white px-10 py-4 rounded-2xl font-bold hover:bg-teal-700 dark:hover:bg-teal-600 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5" />}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 p-12 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-20 h-20 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutDashboard className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Panel de Gestión</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto font-medium">
                Selecciona una opción del menú lateral para comenzar a gestionar tu contenido.
              </p>
            </div>
          </div>
        )}
        {/* Confirm Delete Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¿Estás seguro?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Esta acción no se puede deshacer. 
                {confirmDelete.type === 'category' && ' Al eliminar una categoría, los lugares asociados podrían verse afectados.'}
                {confirmDelete.type === 'user' && (
                  <>
                    {' '}Estás a punto de eliminar al usuario <span className="font-bold text-red-600 dark:text-red-400">{confirmDelete.extraData?.full_name || confirmDelete.extraData?.email || 'este usuario'}</span>. 
                    Se eliminará su cuenta de acceso y su perfil en la base de datos.
                  </>
                )}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (confirmDelete.type === 'place') handleDeletePlace(confirmDelete.id);
                    if (confirmDelete.type === 'category') handleDeleteCategory(confirmDelete.id);
                    if (confirmDelete.type === 'subcategory') handleDeleteSubcategory(confirmDelete.id);
                    if (confirmDelete.type === 'commune') handleDeleteCommune(confirmDelete.id);
                    if (confirmDelete.type === 'media') handleDeleteMedia(confirmDelete.extraData);
                    if (confirmDelete.type === 'tour') handleDeleteTour(confirmDelete.id);
                    if (confirmDelete.type === 'notification' as any) handleDeleteNotification(confirmDelete.id);
                    if (confirmDelete.type === 'menu' as any) handleDeleteMenuItem(confirmDelete.id);
                    if (confirmDelete.type === 'user') handleDeleteUser(confirmDelete.id);
                  }}
                  className="flex-1 bg-red-600 dark:bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-all"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {error && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
              <button
                onClick={() => setError(null)}
                className="w-full bg-gray-900 dark:bg-gray-700 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-gray-600 transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {success && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¡Éxito!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
