import React from 'react';
import { Plus, Upload, Loader2, Edit2, Trash2 } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { Commune } from '../../types';
import { ElegantImage } from '../ElegantImage';
import { optimizeImageUrl } from '../../utils/image';

interface AdminCommunesProps {
  communes: Commune[];
  isAddingCommune: boolean;
  setIsAddingCommune: (val: boolean) => void;
  editingCommune: Commune | null;
  setEditingCommune: (val: Commune | null) => void;
  newCommune: any;
  setNewCommune: (val: any) => void;
  handleAddCommune: (e: React.FormEvent) => void;
  isLoaded: boolean;
  setCommuneAutocomplete: (val: any) => void;
  handleCommuneChanged: () => void;
  startEditCommune: (commune: Commune) => void;
  setConfirmDelete: (data: any) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: any) => void;
  isUploading: boolean;
}

export function AdminCommunes({
  communes,
  isAddingCommune,
  setIsAddingCommune,
  editingCommune,
  setEditingCommune,
  newCommune,
  setNewCommune,
  handleAddCommune,
  isLoaded,
  setCommuneAutocomplete,
  handleCommuneChanged,
  startEditCommune,
  setConfirmDelete,
  handleImageUpload,
  isUploading
}: AdminCommunesProps) {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="admin-section-header">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="admin-title">Comunas</h2>
            <div className="admin-header-badge">
              <span>{communes.length} Ubicaciones</span>
            </div>
          </div>
          <p className="admin-subtitle">Personaliza las imágenes y ubicaciones de las comunas en el mapa.</p>
        </div>
        <button
          onClick={() => {
            setEditingCommune(null);
            setNewCommune({ name: '', lat: 0, lng: 0, image_url: '' });
            setIsAddingCommune(true);
          }}
          className="admin-btn-primary shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Comuna</span>
        </button>
      </div>

      {isAddingCommune && (
        <div className="premium-card border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">
            {editingCommune ? 'Editar Comuna' : 'Nueva Comuna'}
          </h3>
          <form onSubmit={handleAddCommune} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="admin-label">Nombre de la Comuna (Buscar en Google Maps)</label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={setCommuneAutocomplete}
                  onPlaceChanged={handleCommuneChanged}
                >
                  <input
                    type="text"
                    required
                    placeholder="Busca una comuna..."
                    className="admin-input"
                    value={newCommune.name}
                    onChange={(e) => setNewCommune({ ...newCommune, name: e.target.value })}
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  required
                  className="admin-input"
                  value={newCommune.name}
                  onChange={(e) => setNewCommune({ ...newCommune, name: e.target.value })}
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
                value={newCommune.lat}
                onChange={(e) => setNewCommune({ ...newCommune, lat: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="admin-label">Longitud</label>
              <input
                type="number"
                step="any"
                required
                className="admin-input"
                value={newCommune.lng}
                onChange={(e) => setNewCommune({ ...newCommune, lng: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="admin-label">Imagen de Fondo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="URL de la imagen"
                  className="admin-input"
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
              <button type="submit" className="admin-btn-primary">
                {editingCommune ? 'Actualizar' : 'Guardar'} Comuna
              </button>
              <button 
                type="button" 
                onClick={() => { setIsAddingCommune(false); setEditingCommune(null); }} 
                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communes.map((commune) => (
          <div key={commune.id} className="premium-card overflow-hidden group hover:shadow-2xl transition-all p-0 border-0">
            <div className="h-44 relative overflow-hidden">
              <ElegantImage 
                src={optimizeImageUrl(commune.image_url, 400)} 
                alt={commune.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-white font-black text-2xl mb-1">{commune.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase tracking-widest bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg w-fit">
                    {commune.lat.toFixed(4)}, {commune.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-end bg-white dark:bg-gray-800 gap-2">
              <button 
                onClick={() => startEditCommune(commune)}
                className="p-2.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all"
                title="Editar"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setConfirmDelete({ type: 'commune', id: commune.id })}
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
