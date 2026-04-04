import React from 'react';
import { Plus, Bell, X, UploadCloud, Loader2, Edit2, Trash2 } from 'lucide-react';
import { AppNotification } from '../../types';
import { ElegantImage } from '../ElegantImage';
import { optimizeImageUrl } from '../../utils/image';

interface AdminNotificationsProps {
  notifications: AppNotification[];
  userRole: string | null;
  isAddingNotification: boolean;
  setIsAddingNotification: (val: boolean) => void;
  editingNotification: AppNotification | null;
  setEditingNotification: (val: AppNotification | null) => void;
  newNotification: any;
  setNewNotification: (val: any) => void;
  handleSaveNotification: (e: React.FormEvent) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: any) => void;
  isUploading: boolean;
  startEditNotification: (notification: AppNotification) => void;
  setConfirmDelete: (data: any) => void;
}

export function AdminNotifications({
  notifications,
  userRole,
  isAddingNotification,
  setIsAddingNotification,
  editingNotification,
  setEditingNotification,
  newNotification,
  setNewNotification,
  handleSaveNotification,
  handleImageUpload,
  isUploading,
  startEditNotification,
  setConfirmDelete
}: AdminNotificationsProps) {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="admin-section-header">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="admin-title">Notificaciones</h2>
            <div className="admin-header-badge">
              <span>{notifications.length} Activas</span>
            </div>
          </div>
          <p className="admin-subtitle">Envía mensajes globales y promociones a todos los usuarios de la red.</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => {
              setEditingNotification(null);
              setNewNotification({ title: '', message: '', type: 'info', image_url: '', link_url: '', is_active: true });
              setIsAddingNotification(true);
            }}
            className="admin-btn-primary shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Notificación</span>
          </button>
        )}
      </div>

      {isAddingNotification && (
        <div className="premium-card border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">
            {editingNotification ? 'Editar Notificación' : 'Nueva Notificación'}
          </h3>
          <form onSubmit={handleSaveNotification} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="admin-label">Título</label>
                <input
                  type="text"
                  required
                  className="admin-input"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Ej: ¡Oferta Imperdible!"
                />
              </div>
              <div>
                <label className="admin-label">Tipo</label>
                <select
                  className="admin-input"
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
              <label className="admin-label">Imagen (Opcional)</label>
              <div className="flex items-center gap-4">
                {newNotification.image_url && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
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
                <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl hover:border-sky-500 dark:hover:border-sky-400 transition-all cursor-pointer group">
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
              <label className="admin-label">Link de la Oferta (Opcional)</label>
              <input
                type="url"
                className="admin-input"
                value={newNotification.link_url || ''}
                onChange={(e) => setNewNotification({ ...newNotification, link_url: e.target.value })}
                placeholder="https://ejemplo.com/oferta"
              />
            </div>
            <div>
              <label className="admin-label">Mensaje</label>
              <textarea
                required
                rows={4}
                className="admin-input resize-none"
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
              <button type="submit" className="admin-btn-primary">
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
          <div key={notification.id} className={`premium-card hover:shadow-2xl transition-all duration-300 border-l-4 ${
            notification.type === 'success' ? 'border-l-green-500' :
            notification.type === 'warning' ? 'border-l-yellow-500' :
            notification.type === 'error' ? 'border-l-red-500' :
            'border-l-sky-500'
          }`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl shadow-sm ${
                  notification.type === 'success' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' :
                  notification.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                  notification.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                  'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                }`}>
                  {notification.image_url ? (
                    <ElegantImage 
                      src={optimizeImageUrl(notification.image_url, 100)} 
                      alt="" 
                      className="w-14 h-14 object-cover rounded-xl" 
                      containerClassName="w-14 h-14 rounded-xl overflow-hidden"
                    />
                  ) : (
                    <Bell className="w-7 h-7" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{notification.title}</h3>
                    {!notification.is_active && (
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700">Inactiva</span>
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium line-clamp-2 max-w-2xl">{notification.message}</p>
                  {notification.created_at && !isNaN(new Date(notification.created_at).getTime()) && (
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      Creada el {new Date(notification.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              {userRole === 'admin' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => startEditNotification(notification)}
                    className="p-2.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete({ type: 'notification' as any, id: notification.id })}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
