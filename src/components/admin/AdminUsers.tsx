import React from 'react';
import { Trash2, ChevronDown, Search, X, Check } from 'lucide-react';
import { User, Place } from '../../types';

interface AdminUsersProps {
  users: User[];
  currentUser: User | null;
  isUpdatingUser: string | null;
  handleUpdateUser: (userId: string, data: Partial<User>) => void;
  setConfirmDelete: (data: any) => void;
  places: Place[];
  selectingPlacesForUser: User | null;
  setSelectingPlacesForUser: (user: User | null) => void;
  tempAssignedPlaces: string[];
  setTempAssignedPlaces: (ids: string[]) => void;
  placeSearchTerm: string;
  setPlaceSearchTerm: (term: string) => void;
}

export function AdminUsers({
  users,
  currentUser,
  isUpdatingUser,
  handleUpdateUser,
  setConfirmDelete,
  places,
  selectingPlacesForUser,
  setSelectingPlacesForUser,
  tempAssignedPlaces,
  setTempAssignedPlaces,
  placeSearchTerm,
  setPlaceSearchTerm
}: AdminUsersProps) {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="admin-section-header">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="admin-title">Usuarios</h2>
            <div className="admin-header-badge">
              <span>{users.length} Miembros</span>
            </div>
          </div>
          <p className="admin-subtitle">Administra los roles de los usuarios y asigna lugares para su gestión.</p>
        </div>
      </div>

      <div className="premium-card overflow-hidden p-0 border-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rol</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Gestiona</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black border border-sky-100 dark:border-sky-500/20">
                        {u.full_name?.charAt(0) || u.username?.charAt(0) || u.email?.charAt(0) || '?'}
                      </div>
                      <span className="font-black text-gray-900 dark:text-white">{u.full_name || u.username || 'Sin nombre'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none disabled:opacity-50 transition-all"
                      value={u.role}
                      disabled={isUpdatingUser === u.id || u.id === currentUser?.id}
                      onChange={(e) => handleUpdateUser(u.id, { role: e.target.value as any })}
                    >
                      <option value="user">USER</option>
                      <option value="owner">OWNER</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectingPlacesForUser(u);
                        setTempAssignedPlaces(u.assigned_place_ids || []);
                        setPlaceSearchTerm('');
                      }}
                      disabled={isUpdatingUser === u.id || u.role !== 'owner'}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs font-black text-gray-900 dark:text-white hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/10 transition-all disabled:opacity-50 text-left w-full truncate max-w-[180px] flex items-center justify-between group"
                    >
                      <span className="truncate">
                        {u.assigned_place_ids && u.assigned_place_ids.length > 0
                          ? `${u.assigned_place_ids.length} LOCALES`
                          : 'ASIGNAR...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-sky-500 transition-colors" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end pr-2">
                      <button
                        onClick={() => setConfirmDelete({ type: 'user', id: u.id, extraData: u })}
                        disabled={u.id === currentUser?.id}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Eliminar usuario"
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
      </div>

      {/* Selecting Places Modal */}
      {selectingPlacesForUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Asignar Locales</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Asignando a: <span className="text-sky-600 dark:text-sky-400 font-bold">{selectingPlacesForUser.full_name || selectingPlacesForUser.email}</span></p>
              </div>
              <button 
                onClick={() => setSelectingPlacesForUser(null)}
                className="p-3 bg-white dark:bg-gray-800 rounded-2xl text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 flex-1 overflow-hidden flex flex-col gap-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Buscar local..."
                  value={placeSearchTerm}
                  onChange={(e) => setPlaceSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto min-h-[300px] border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {places.filter(p => placeSearchTerm ? p.name.toLowerCase().includes(placeSearchTerm.toLowerCase()) : true).map(place => (
                  <label key={place.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox"
                        checked={tempAssignedPlaces.includes(place.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempAssignedPlaces([...tempAssignedPlaces, place.id]);
                          } else {
                            setTempAssignedPlaces(tempAssignedPlaces.filter(id => id !== place.id));
                          }
                        }}
                        className="peer appearance-none w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-md checked:bg-sky-500 checked:border-sky-500 transition-all cursor-pointer"
                      />
                      <Check className="w-4 h-4 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white flex-1">{place.name}</span>
                  </label>
                ))}
                {places.filter(p => !placeSearchTerm || p.name.toLowerCase().includes(placeSearchTerm.toLowerCase())).length === 0 && (
                  <div className="p-12 text-center text-gray-500 font-medium">No se encontraron locales.</div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setSelectingPlacesForUser(null)}
                className="px-6 py-3 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectingPlacesForUser) {
                    handleUpdateUser(selectingPlacesForUser.id, { assigned_place_ids: tempAssignedPlaces });
                    setSelectingPlacesForUser(null);
                  }
                }}
                className="px-6 py-3 font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
              >
                <span>Guardar Cambios</span>
                {tempAssignedPlaces.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">{tempAssignedPlaces.length}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
