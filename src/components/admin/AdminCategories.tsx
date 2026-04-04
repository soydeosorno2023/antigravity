import React from 'react';
import { 
  Plus, Edit2, Trash2, Layers, ChevronUp, ChevronDown, 
  Palmtree, Map as MapIcon, Hotel, Utensils, Globe, Upload, Loader2, X 
} from 'lucide-react';
import { Category, Subcategory } from '../../types';

interface AdminCategoriesProps {
  categories: Category[];
  subcategories: Subcategory[];
  isAddingCategory: boolean;
  setIsAddingCategory: (val: boolean) => void;
  editingCategory: Category | null;
  setEditingCategory: (val: Category | null) => void;
  newCategory: any;
  setNewCategory: (val: any) => void;
  handleAddCategory: (e: React.FormEvent) => void;
  isAddingSubcategory: boolean;
  setIsAddingSubcategory: (val: boolean) => void;
  editingSubcategory: Subcategory | null;
  setEditingSubcategory: (val: Subcategory | null) => void;
  newSubcategory: any;
  setNewSubcategory: (val: any) => void;
  handleAddSubcategory: (e: React.FormEvent) => void;
  handleMoveCategory: (id: string, direction: 'up' | 'down') => void;
  handleMoveSubcategory: (id: string, direction: 'up' | 'down') => void;
  startEditCategory: (cat: Category) => void;
  startEditSubcategory: (sub: Subcategory) => void;
  setConfirmDelete: (data: any) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: any) => void;
  isUploading: boolean;
}

export function AdminCategories({
  categories,
  subcategories,
  isAddingCategory,
  setIsAddingCategory,
  editingCategory,
  setEditingCategory,
  newCategory,
  setNewCategory,
  handleAddCategory,
  isAddingSubcategory,
  setIsAddingSubcategory,
  editingSubcategory,
  setEditingSubcategory,
  newSubcategory,
  setNewSubcategory,
  handleAddSubcategory,
  handleMoveCategory,
  handleMoveSubcategory,
  startEditCategory,
  startEditSubcategory,
  setConfirmDelete,
  handleImageUpload,
  isUploading
}: AdminCategoriesProps) {
  const icons: { [key: string]: any } = {
    PalmTree: Palmtree,
    Map: MapIcon,
    Hotel: Hotel,
    Utensils: Utensils,
    Theater: Globe,
    Trees: Globe
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="admin-section-header">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="admin-title">Categorías</h2>
            <div className="admin-header-badge">
              <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{categories.length} Estructuras</span>
            </div>
          </div>
          <p className="admin-subtitle">Organiza tus lugares por temáticas y gestiona sus subcategorías.</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setNewCategory({ name: '', icon: 'Map', image_url: '', slug: '', order_index: 0 });
            setIsAddingCategory(true);
          }}
          className="admin-btn-primary shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {isAddingCategory && (
        <div className="premium-card border-teal-100 dark:border-teal-900/50">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="admin-label">Nombre</label>
              <input
                type="text"
                required
                className="admin-input"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              />
            </div>
            <div>
              <label className="admin-label">Icono (Lucide Name)</label>
              <input
                type="text"
                required
                className="admin-input"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Slug</label>
              <input
                type="text"
                required
                className="admin-input"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Imagen de Categoría (Opcional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="URL de la imagen"
                  className="admin-input"
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
              <button type="submit" className="admin-btn-primary">
                {editingCategory ? 'Actualizar' : 'Guardar'} Categoría
              </button>
              <button 
                type="button" 
                onClick={() => { setIsAddingCategory(false); setEditingCategory(null); }} 
                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isAddingSubcategory && (
        <div className="premium-card border-sky-100 dark:border-sky-900/50">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">
            {editingSubcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
          </h3>
          <form onSubmit={handleAddSubcategory} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="admin-label">Categoría Padre</label>
              <select
                required
                className="admin-input"
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
              <label className="admin-label">Nombre</label>
              <input
                type="text"
                required
                className="admin-input"
                value={newSubcategory.name}
                onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              />
            </div>
            <div>
              <label className="admin-label">Slug</label>
              <input
                type="text"
                required
                className="admin-input"
                value={newSubcategory.slug}
                onChange={(e) => setNewSubcategory({ ...newSubcategory, slug: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="admin-btn-primary">
                {editingSubcategory ? 'Actualizar' : 'Guardar'} Subcategoría
              </button>
              <button 
                type="button" 
                onClick={() => { setIsAddingSubcategory(false); setEditingSubcategory(null); }} 
                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...categories].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((cat, index, array) => {
          const Icon = icons[cat.icon] || MapIcon;
          
          return (
            <div key={cat.id} className="premium-card group hover:border-sky-200 dark:hover:border-sky-900 transition-all p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex flex-col gap-1 items-center bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
                    <button 
                      onClick={() => handleMoveCategory(cat.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-300 dark:text-gray-600 hover:text-sky-500 disabled:opacity-0 transition-all"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleMoveCategory(cat.id, 'down')}
                      disabled={index === array.length - 1}
                      className="p-1 text-gray-300 dark:text-gray-600 hover:text-sky-500 disabled:opacity-0 transition-all"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-[1.5rem] shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 dark:group-hover:bg-sky-500 group-hover:text-white transition-all duration-500">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white text-xl leading-tight">{cat.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-sky-500 dark:text-sky-400">/{cat.slug}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => startEditCategory(cat)}
                    className="p-2.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete({ type: 'category', id: cat.id })}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
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
  );
}
