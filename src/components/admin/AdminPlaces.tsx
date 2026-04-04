import React from 'react';
import { 
  Plus, Edit2, Trash2, Star, Dog, ParkingCircle, Wifi, 
  ChevronRight, ChevronDown, Search, X, Upload, Loader2, 
  MapPin, Eye, EyeOff, Utensils, Plane, MessageSquare,
  Instagram, RefreshCw
} from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { Place, Category, Subcategory, MenuItem, Tour, PlaceReview } from '../../types';
import { ElegantImage } from '../ElegantImage';
import { optimizeImageUrl } from '../../utils/image';
import './AdminPlaces.css';

interface AdminPlacesProps {
  places: Place[];
  filteredPlaces: Place[];
  categories: Category[];
  subcategories: Subcategory[];
  isAddingPlace: boolean;
  setIsAddingPlace: (val: boolean) => void;
  editingPlace: Place | null;
  setEditingPlace: (val: Place | null) => void;
  newPlace: any;
  setNewPlace: (val: any) => void;
  handleAddPlace: (e: React.FormEvent) => void;
  resetPlaceForm: () => void;
  startEditPlace: (place: Place) => void;
  setConfirmDelete: (data: any) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: any) => void;
  isUploading: boolean;
  userRole: string | null;
  isLoaded: boolean;
  setAutocomplete: (val: any) => void;
  handlePlaceChanged: () => void;
  activeSubForm: 'details' | 'menu' | 'tours' | 'reviews';
  setActiveSubForm: (val: 'details' | 'menu' | 'tours' | 'reviews') => void;
  menuItems: MenuItem[];
  newMenuItem: any;
  setNewMenuItem: (val: any) => void;
  handleAddMenuItem: (e: React.FormEvent) => void;
  startEditMenuItem: (item: MenuItem) => void;
  handleToggleMenuItemAvailability: (item: MenuItem) => void;
  tours: Tour[];
  newTour: any;
  setNewTour: (val: any) => void;
  handleAddTour: (e: React.FormEvent) => void;
  isAddingTour: boolean;
  setIsAddingTour: (val: boolean) => void;
  reviews: PlaceReview[];
  isAddingMenuItem: boolean;
  setIsAddingMenuItem: (val: boolean) => void;
  editingMenuItem: MenuItem | null;
  handleConnectInstagram: (id: string | undefined) => void;
}

export function AdminPlaces({
  places,
  filteredPlaces,
  categories,
  subcategories,
  isAddingPlace,
  setIsAddingPlace,
  editingPlace,
  setEditingPlace,
  newPlace,
  setNewPlace,
  handleAddPlace,
  resetPlaceForm,
  startEditPlace,
  setConfirmDelete,
  handleImageUpload,
  isUploading,
  userRole,
  isLoaded,
  setAutocomplete,
  handlePlaceChanged,
  activeSubForm,
  setActiveSubForm,
  menuItems,
  newMenuItem,
  setNewMenuItem,
  handleAddMenuItem,
  startEditMenuItem,
  handleToggleMenuItemAvailability,
  tours,
  newTour,
  setNewTour,
  handleAddTour,
  isAddingTour,
  setIsAddingTour,
  reviews,
  isAddingMenuItem,
  setIsAddingMenuItem,
  editingMenuItem,
  handleConnectInstagram
}: AdminPlacesProps) {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="admin-section-header">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="admin-title">Lugares</h2>
            <div className="admin-header-badge">
              <MapPin className="w-3 h-3" />
              <span>{places.length} Registrados</span>
            </div>
          </div>
          <p className="admin-subtitle">
            Gestiona los establecimientos y puntos de interés de la red.
          </p>
        </div>
        {!isAddingPlace && userRole === 'admin' && (
          <button 
            onClick={() => {
              setEditingPlace(null);
              resetPlaceForm();
              setIsAddingPlace(true);
            }}
            className="admin-btn-primary shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Lugar</span>
          </button>
        )}
      </div>

      {isAddingPlace && (
        <div className="premium-card animate-fade-up">
          <div className="section-header">
            <h3 className="section-title">
              {editingPlace ? `Editando: ${editingPlace.name}` : 'Registrar Nuevo Lugar'}
            </h3>
            <button 
              onClick={() => { setIsAddingPlace(false); setEditingPlace(null); resetPlaceForm(); }}
              className="action-btn"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="form-tabs">
            {[
              { id: 'details', label: 'Información', icon: MapPin },
              { id: 'menu', label: 'Menú/Carta', icon: Utensils },
              { id: 'tours', label: 'Tours', icon: Plane },
              { id: 'reviews', label: 'Reseñas', icon: MessageSquare },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubForm(tab.id as any)}
                className={`form-tab-btn ${activeSubForm === tab.id ? 'active' : ''}`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddPlace} className="space-y-8">
            {activeSubForm === 'details' && (
              <div className="admin-form-grid animate-fade-up">
                <div className="form-group-full">
                  <label className="admin-label">Nombre del Lugar</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    value={newPlace.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                      setNewPlace({ ...newPlace, name, slug });
                    }}
                  />
                </div>

                <div>
                  <label className="admin-label">Enlace Amigable (Slug)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--admin-text-muted)' }}>/lugar/</span>
                    <input
                      type="text"
                      required
                      className="admin-input"
                      value={newPlace.slug}
                      onChange={(e) => setNewPlace({ ...newPlace, slug: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="admin-label">Categoría</label>
                  <select
                    required
                    className="admin-input"
                    value={newPlace.category_id}
                    onChange={(e) => setNewPlace({ ...newPlace, category_id: e.target.value, subcategory_id: '' })}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-label">Subcategoría (Opcional)</label>
                  <select
                    className="admin-input"
                    value={newPlace.subcategory_id}
                    onChange={(e) => setNewPlace({ ...newPlace, subcategory_id: e.target.value })}
                  >
                    <option value="">Sin subcategoría</option>
                    {subcategories.filter(s => s.category_id === newPlace.category_id).map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-full">
                  <label className="admin-label">Dirección Completa (Google Maps)</label>
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={setAutocomplete}
                      onPlaceChanged={handlePlaceChanged}
                    >
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="Escribe para buscar dirección..."
                        value={newPlace.address}
                        onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                      />
                    </Autocomplete>
                  ) : (
                    <input
                      type="text"
                      required
                      className="admin-input"
                      value={newPlace.address}
                      onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                    />
                  )}
                </div>

                <div>
                  <label className="admin-label">Latitud</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="admin-input"
                    value={newPlace.lat}
                    onChange={(e) => setNewPlace({ ...newPlace, lat: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="admin-label">Longitud</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="admin-input"
                    value={newPlace.lng}
                    onChange={(e) => setNewPlace({ ...newPlace, lng: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="form-group-full">
                  <label className="admin-label">Descripción</label>
                  <textarea
                    required
                    className="admin-input"
                    style={{ height: '120px', resize: 'none' }}
                    value={newPlace.description}
                    onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Teléfono</label>
                  <input
                    type="tel"
                    className="admin-input"
                    value={newPlace.phone}
                    onChange={(e) => setNewPlace({ ...newPlace, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Sitio Web</label>
                  <input
                    type="url"
                    className="admin-input"
                    value={newPlace.website}
                    onChange={(e) => setNewPlace({ ...newPlace, website: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Imagen de Perfil</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="admin-input"
                      value={newPlace.profile_image_url}
                      onChange={(e) => setNewPlace({ ...newPlace, profile_image_url: e.target.value })}
                    />
                    <label className="action-btn" style={{ background: 'var(--admin-bg)', color: 'var(--admin-accent)', cursor: 'pointer' }}>
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Imagen de Portada (Cover)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="admin-input"
                      value={newPlace.cover_image_url}
                      onChange={(e) => setNewPlace({ ...newPlace, cover_image_url: e.target.value })}
                    />
                    <label className="action-btn" style={{ background: 'var(--admin-bg)', color: 'var(--admin-accent)', cursor: 'pointer' }}>
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div className="form-group-full">
                  <label className="admin-label">Instagram Business</label>
                  <div style={{ 
                    padding: '1.5rem', 
                    background: 'linear-gradient(135deg, rgba(245, 176, 39, 0.05), rgba(249, 115, 22, 0.05))', 
                    borderRadius: '1.5rem', 
                    border: '1px solid var(--admin-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                        <Instagram className="w-6 h-6" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800 }}>Vincular Contenido</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Muestra tus últimas publicaciones automáticamente.</p>
                      </div>
                    </div>
                    {newPlace.instagram_username ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 800 }}>@{newPlace.instagram_username}</p>
                          <p style={{ fontSize: '10px', color: '#22c55e', fontWeight: 900, textTransform: 'uppercase' }}>Conectado</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleConnectInstagram(editingPlace?.id)}
                          className="action-btn"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => handleConnectInstagram(editingPlace?.id)}
                        className="admin-btn-primary"
                        style={{ padding: '0.75rem 1.5rem' }}
                      >
                        Conectar Cuenta
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group-full">
                  <label className="admin-label">Galería de Imágenes</label>
                  <div className="gallery-manager-box">
                    <div className="gallery-grid-preview">
                      {newPlace.gallery && newPlace.gallery.map((url: string, idx: number) => (
                        <div key={idx} className="gallery-item-preview">
                          <ElegantImage src={optimizeImageUrl(url, 200)} alt={`Gallery ${idx}`} className="w-full h-full object-cover rounded-xl" />
                          <button 
                            type="button" 
                            className="gallery-item-delete"
                            onClick={() => {
                              const updatedGallery = newPlace.gallery.filter((_: string, i: number) => i !== idx);
                              setNewPlace({ ...newPlace, gallery: updatedGallery });
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <label className="gallery-add-btn">
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                        <span>Añadir</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} disabled={isUploading} />
                      </label>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Sube hasta 10 imágenes para mostrar en el perfil del lugar.</p>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Video Promocional</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="URL YouTube/Directa"
                    value={newPlace.video_url || ''}
                    onChange={(e) => setNewPlace({ ...newPlace, video_url: e.target.value })}
                  />
                </div>

                <div className="form-group-full" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                  gap: '1.5rem',
                  padding: '1.5rem',
                  background: 'var(--admin-bg)',
                  borderRadius: '1.5rem'
                }}>
                  {[
                    { key: 'is_active', label: 'Visible', icon: Eye },
                    { key: 'is_featured', label: 'Destacado', icon: Star },
                    { key: 'is_pet_friendly', label: 'Pet Friendly', icon: Dog },
                    { key: 'has_parking', label: 'Parking', icon: ParkingCircle },
                    { key: 'has_wifi', label: 'Wi-Fi', icon: Wifi },
                  ].map(feat => (
                    <label key={feat.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        style={{ width: '1.25rem', height: '1.25rem' }}
                        checked={newPlace[feat.key]}
                        onChange={(e) => setNewPlace({ ...newPlace, [feat.key]: e.target.checked })}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{feat.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeSubForm === 'menu' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black text-gray-900 dark:text-white">Gestión de Carta / Menú</h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingMenuItem(!isAddingMenuItem)}
                    className="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                  >
                    {isAddingMenuItem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAddingMenuItem ? 'Cancelar' : 'Añadir Ítem'}
                  </button>
                </div>

                {isAddingMenuItem && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nombre del plato/bebida"
                        className="admin-input"
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Precio (ej: 12000)"
                        className="admin-input"
                        value={newMenuItem.price || ''}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseInt(e.target.value) || 0 })}
                      />
                      <input
                        type="text"
                        placeholder="Categoría (ej: Entradas, Postres)"
                        className="admin-input"
                        value={newMenuItem.category}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="URL de imagen"
                          className="admin-input"
                          value={newMenuItem.image_url}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, image_url: e.target.value })}
                        />
                        <label className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl cursor-pointer">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'menu')} disabled={isUploading} />
                        </label>
                      </div>
                    </div>
                    <textarea
                      placeholder="Descripción de los ingredientes o preparación"
                      className="admin-input h-24"
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={handleAddMenuItem}
                      className="admin-btn-primary w-full"
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
                          className={`p-2 rounded-lg transition-all ${item.is_available ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                          {item.is_available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditMenuItem(item)}
                          className="p-2 text-gray-300 hover:text-sky-500 transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ type: 'menu', id: item.id })}
                          className="p-2 text-gray-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubForm === 'tours' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="flex items-center justify-between">
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
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nombre del tour"
                        className="admin-input"
                        value={newTour.name}
                        onChange={(e) => setNewTour({ ...newTour, name: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Precio (ej: 25000)"
                        className="admin-input"
                        value={newTour.price || ''}
                        onChange={(e) => setNewTour({ ...newTour, price: parseFloat(e.target.value) || 0 })}
                      />
                      <input
                        type="text"
                        placeholder="Duración (ej: 2 horas)"
                        className="admin-input"
                        value={newTour.duration}
                        onChange={(e) => setNewTour({ ...newTour, duration: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="URL de imagen"
                          className="admin-input"
                          value={newTour.image_url}
                          onChange={(e) => setNewTour({ ...newTour, image_url: e.target.value })}
                        />
                        <label className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl cursor-pointer">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'tour')} disabled={isUploading} />
                        </label>
                      </div>
                    </div>
                    <textarea
                      placeholder="Descripción del tour"
                      className="admin-input h-24"
                      value={newTour.description}
                      onChange={(e) => setNewTour({ ...newTour, description: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={handleAddTour}
                      className="admin-btn-primary w-full"
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
                        className="p-2 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubForm === 'reviews' && (
              <div className="space-y-6 animate-in fade-in">
                <h4 className="text-xl font-black text-gray-900 dark:text-white">Reseñas de Clientes</h4>
                {reviews.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium italic">No hay reseñas todavía para este lugar.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {review.user_avatar ? (
                              <ElegantImage 
                                src={optimizeImageUrl(review.user_avatar, 80)} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                containerClassName="w-full h-full"
                              />
                            ) : (
                              <X className="w-5 h-5 text-gray-400" />
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
                          <span className="ml-auto text-[10px] text-gray-400 font-medium">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
              <button type="submit" className="admin-btn-primary px-12 py-4 text-lg">
                <Plus className="w-6 h-6" />
                {editingPlace ? 'Actualizar Lugar' : 'Publicar Lugar'}
              </button>
              <button 
                type="button" 
                onClick={() => { setIsAddingPlace(false); setEditingPlace(null); resetPlaceForm(); }} 
                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Places Table */}
      <div className="admin-table-wrapper animate-fade-up">
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Lugar</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlaces.map((place) => (
                <tr key={place.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 shadow-sm border border-white dark:border-gray-700">
                        <ElegantImage
                          src={optimizeImageUrl(place.profile_image_url || `https://picsum.photos/seed/${place.id}/100/100`, 100)}
                          alt=""
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 dark:text-white truncate">{place.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{place.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl w-fit">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        place.category_id ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {categories.find(c => c.id === place.category_id)?.name || 'Sin Categoría'}
                      </span>
                      {place.subcategory_id && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
                          {subcategories.find(s => s.id === place.subcategory_id)?.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        place.is_active ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${place.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span>{place.is_active ? 'Visible' : 'Oculto'}</span>
                      </div>
                      {place.is_featured && <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => startEditPlace(place)}
                        className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ type: 'place', id: place.id })}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                        title="Eliminar"
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
        <div className="md:hidden">
          {filteredPlaces.map((place) => (
            <div key={place.id} className="mobile-place-card">
              <div className="place-info-cell">
                <ElegantImage
                  src={optimizeImageUrl(place.profile_image_url || `https://picsum.photos/seed/${place.id}/100/100`, 160)}
                  alt=""
                  className="place-info-avatar"
                  style={{ width: '64px', height: '64px' }}
                  containerClassName="place-info-avatar"
                />
                <div>
                  <div className="place-info-name">{place.name}</div>
                  <div className="admin-badge badge-teal">
                    {categories.find(c => c.id === place.category_id)?.name}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => startEditPlace(place)}
                  className="admin-btn-primary"
                  style={{ flex: 1, padding: '0.75rem', fontSize: '0.75rem' }}
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button 
                  onClick={() => setConfirmDelete({ type: 'place', id: place.id })}
                  className="action-btn delete"
                  style={{ flex: 1, justifyContent: 'center', background: '#fef2f2' }}
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
  );
}
