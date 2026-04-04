import React from 'react';
import { ImageIcon, Upload, Loader2, Download, UploadCloud } from 'lucide-react';
import { AppSettings } from '../../types';
import { ElegantImage } from '../ElegantImage';
import { optimizeImageUrl } from '../../utils/image';

interface AdminSettingsProps {
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
  handleUpdateSettings: (e: React.FormEvent) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: any) => void;
  isUploading: boolean;
  handleExportData: () => void;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

export function AdminSettings({
  appSettings,
  setAppSettings,
  handleUpdateSettings,
  handleImageUpload,
  isUploading,
  handleExportData,
  handleImportData,
  loading
}: AdminSettingsProps) {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="admin-section-header">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="admin-title">Configuración</h2>
            <div className="admin-header-badge">
              <span>Ajustes Globales</span>
            </div>
          </div>
          <p className="admin-subtitle">Personaliza la apariencia, el logo y los datos fundamentales de tu aplicación.</p>
        </div>
      </div>

      <div className="premium-card">
        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="admin-label">Logo de la Aplicación</label>
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
                      className="admin-input"
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
              <label className="admin-label">Imagen de Fondo (Header)</label>
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
                      placeholder="URL de la imagen hero"
                      className="admin-input"
                      value={appSettings.hero_image_url || ''}
                      onChange={(e) => setAppSettings({ ...appSettings, hero_image_url: e.target.value })}
                    />
                    <label className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 p-3 rounded-xl cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-all flex items-center justify-center min-w-[50px]">
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} disabled={isUploading} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="admin-label">Título del Hero</label>
              <input
                type="text"
                className="admin-input"
                value={appSettings.hero_title || ''}
                onChange={(e) => setAppSettings({ ...appSettings, hero_title: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Email de Contacto</label>
              <input
                type="email"
                className="admin-input"
                value={appSettings.contact_email || ''}
                onChange={(e) => setAppSettings({ ...appSettings, contact_email: e.target.value })}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="admin-btn-primary w-full py-4 text-lg"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Guardar Configuración'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="premium-card">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Exportar Datos</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-8">Descarga una copia de seguridad íntegra en formato JSON.</p>
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-[1.25rem] font-black hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <Download className="w-5 h-5" />
            <span>DESCARGAR BACKUP</span>
          </button>
        </div>

        <div className="premium-card">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Importar Datos</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-8">Sube un archivo JSON para restaurar o migrar datos.</p>
          <label className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800 text-sky-600 dark:text-sky-400 rounded-[1.25rem] font-black hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all cursor-pointer border border-sky-100 dark:border-sky-500/20 shadow-sm">
            <UploadCloud className="w-5 h-5" />
            <span>{loading ? 'PROCESANDO...' : 'SELECCIONAR ARCHIVO'}</span>
            <input type="file" className="hidden" accept=".json" onChange={handleImportData} disabled={loading} />
          </label>
        </div>
      </div>
    </div>
  );
}
