import React from 'react';
import { ImageIcon, Upload, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { Media } from '../../types';
import { ElegantImage } from '../ElegantImage';
import { optimizeImageUrl } from '../../utils/image';

interface AdminMediaProps {
  media: Media[];
  isUploading: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: any) => void;
  setConfirmDelete: (data: any) => void;
}

export function AdminMedia({
  media,
  isUploading,
  handleImageUpload,
  setConfirmDelete
}: AdminMediaProps) {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-bottom border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">Multimedia</h2>
            <div className="bg-sky-50 dark:bg-sky-500/10 px-3 py-1 rounded-full flex items-center gap-2 border border-sky-100 dark:border-sky-500/20">
              <ImageIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-black text-sky-700 dark:text-sky-300 uppercase tracking-wider">{media.length} Archivos</span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl">
            Biblioteca central de imágenes. Aquí se almacenan todas las fotos de lugares, 
            categorías y promociones optimizadas para la web.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="admin-btn-primary cursor-pointer shadow-lg hover:shadow-orange-500/20 transition-all min-w-[200px] justify-center">
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="animate-pulse">SUBIENDO ARCHIVOS...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Subir Imágenes</span>
              </>
            )}
            <input 
              type="file" 
              style={{ display: 'none' }} 
              accept="image/*" 
              multiple 
              onChange={(e) => handleImageUpload(e, 'gallery')} 
              disabled={isUploading} 
            />
          </label>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-900/20 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xl border border-gray-100 dark:border-gray-700 mb-8">
            <ImageIcon className="w-10 h-10 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Tu galería está vacía</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto mb-8">
            Comienza subiendo tus primeras imágenes para los lugares o categorías del sistema.
          </p>
          <label className="cursor-pointer text-sky-600 dark:text-sky-400 font-bold hover:underline">
            Seleccionar archivos ahora
            <input type="file" style={{ display: 'none' }} accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {media.map((item) => (
            <div key={item.id} className="group relative bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-sky-200 dark:hover:border-sky-900 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500">
              <div className="aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                <ElegantImage 
                  src={optimizeImageUrl(item.url, 400)} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  containerClassName="w-full h-full"
                />
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800">
                <p className="text-[11px] font-black text-gray-900 dark:text-white truncate mb-2" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-gray-800">
                    <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      {(item.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  
                  <div className="flex gap-1">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button 
                      onClick={() => setConfirmDelete({ type: 'media', id: item.id, extraData: item })}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Subtle Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
