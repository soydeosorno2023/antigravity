import React from 'react';
import { User as UserIcon, Upload, Loader2 } from 'lucide-react';
import { User, Place } from '../../types';
import { ElegantImage } from '../ElegantImage';
import { optimizeImageUrl } from '../../utils/image';

interface AdminProfileProps {
  user: User | null;
  profileForm: any;
  setProfileForm: (form: any) => void;
  handleUpdateProfile: (e: React.FormEvent) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: any) => void;
  isUploading: boolean;
  places: Place[];
}

export function AdminProfile({
  user,
  profileForm,
  setProfileForm,
  handleUpdateProfile,
  handleImageUpload,
  isUploading,
  places
}: AdminProfileProps) {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="admin-section-header">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="admin-title">Mi Perfil</h2>
            <div className="premium-card admin-header-badge">
              <UserIcon className="w-3 h-3" />
              <span>Cuenta Activa</span>
            </div>
          </div>
          <p className="admin-subtitle">Gestiona tu información personal, avatar y permisos de acceso.</p>
        </div>
      </div>

      <div className="premium-card max-w-2xl mx-auto md:mx-0">
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
              <label className="admin-label">Nombre Completo</label>
              <input
                type="text"
                required
                className="admin-input"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Email</label>
              <input
                type="email"
                required
                className="admin-input"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Rol</label>
              <input
                type="text"
                disabled
                className="admin-input opacity-50 bg-gray-50 cursor-not-allowed font-bold"
                value={user?.role === 'admin' ? 'Administrador' : 'Dueño de Local'}
              />
            </div>
            {user?.role === 'owner' && (
              <div>
                <label className="admin-label">Local Asignado</label>
                <input
                  type="text"
                  disabled
                  className="admin-input opacity-50 bg-gray-50 cursor-not-allowed"
                  value={(user.assigned_place_ids && user.assigned_place_ids.length > 0) ? user.assigned_place_ids.map(id => places.find(p => p.id === id)?.name || 'Desconocido').join(', ') : 'Ninguno'}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="admin-btn-primary w-full py-4 text-lg"
          >
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}
