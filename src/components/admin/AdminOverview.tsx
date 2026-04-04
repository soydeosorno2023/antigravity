import React from 'react';
import { 
  TrendingUp, Layers, ImageIcon, Bell, Star, Eye, Edit2, ChevronRight, LayoutDashboard 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { Place, Category, Media } from '../../types';

import './AdminOverview.css';

interface AdminOverviewProps {
  userRole: string | null;
  places: Place[];
  categories: Category[];
  reviews: any[];
  media: Media[];
  setActiveTab: (tab: any) => void;
  startEditPlace: (place: Place) => void;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AdminOverview({
  userRole,
  places,
  categories,
  reviews,
  media,
  setActiveTab,
  startEditPlace,
  handleImportData
}: AdminOverviewProps) {
  const chartData = categories.map(cat => ({
    name: cat.name,
    count: places.filter(p => p.category_id === cat.id).length
  })).filter(d => d.count > 0);

  const COLORS = ['#F5B027', '#0284c7', '#ea580c', '#7c3aed', '#db2777', '#2563eb'];

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="admin-section-header">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="admin-title">Panel de Control</h2>
            <div className="admin-header-badge">
              <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Sincronización OK</span>
            </div>
          </div>
          <p className="admin-subtitle">Gestiona, prioriza y analiza el contenido de tu red con facilidad.</p>
        </div>
        {userRole === 'admin' && (
          <label className="admin-btn-primary shadow-lg shadow-orange-500/20 cursor-pointer">
            <span>Importar Backup</span>
            <ChevronRight className="w-5 h-5" />
            <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
          </label>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="premium-card bg-gradient-to-br from-sky-600 to-sky-700 border-0 p-8 shadow-2xl shadow-sky-500/20">
          <p className="text-sky-100/80 font-black uppercase tracking-widest text-[10px] mb-1">Total Lugares</p>
          <h3 className="text-4xl font-black text-white mb-6 leading-none">{places.length}</h3>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-wider border border-white/10">
            <TrendingUp className="w-3 h-3" />
            <span>+12% este mes</span>
          </div>
        </div>

        <div className="premium-card p-8 border-gray-100 dark:border-gray-800">
          <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-[10px] mb-1">
            {userRole === 'admin' ? 'Categorías' : 'Multimedia'}
          </p>
          <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6 leading-none">
            {userRole === 'admin' ? categories.length : media.length}
          </h3>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-50 dark:bg-sky-500/10 rounded-xl text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-wider border border-sky-100 dark:border-sky-500/20">
            {userRole === 'admin' ? <Layers className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
            <span>{userRole === 'admin' ? 'Estructura' : 'Archivos'}</span>
          </div>
        </div>

        <div className="premium-card p-8 border-gray-100 dark:border-gray-800">
          <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-[10px] mb-1">Feedback</p>
          <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6 leading-none">{reviews.length}</h3>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-100 dark:border-orange-500/20">
            <Bell className="w-3 h-3" />
            <span>Reseñas Activas</span>
          </div>
        </div>

        <div className="premium-card p-8 border-gray-100 dark:border-gray-800">
          <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-[10px] mb-1">Destacados</p>
          <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6 leading-none">
            {places.filter(p => p.is_featured).length}
          </h3>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-wider border border-teal-100 dark:border-teal-500/20">
            <Star className="w-3 h-3" />
            <span>Premium</span>
          </div>
        </div>
      </div>

      {/* Analytics & Activity Section */}
      <div className="overview-content-grid">
        <div className="premium-card chart-section">
          <div className="section-header">
            <h3 className="section-title">Distribución por Categoría</h3>
            <select className="admin-select">
              <option>Esta semana</option>
              <option>Este mes</option>
            </select>
          </div>
          <div style={{ height: '350px', width: '100%', marginTop: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-border)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--admin-text-muted)', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'var(--admin-bg)' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: 'var(--admin-shadow)', background: 'var(--admin-card-bg)', backdropFilter: 'blur(10px)' }}
                />
                <Bar dataKey="count" radius={[12, 12, 12, 12]} barSize={48}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overview-sidebar-group">
          <div className="reminder-card animate-fade-up">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Recordatorio</h3>
            <p>Revisión de nuevos locales pendientes de aprobación.</p>
            <button className="reminder-btn">
              <Eye className="w-5 h-5" />
              Ver Pendientes
            </button>
          </div>

          <div className="premium-card">
            <div className="section-header">
              <h3 className="section-title">Actividad Reciente</h3>
              <button style={{ color: 'var(--admin-accent)', fontSize: '0.875rem', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ver Todo</button>
            </div>
            <div className="activity-list">
              {places.slice(0, 4).map((place, i) => (
                <div 
                  key={place.id} 
                  className="activity-item"
                  onClick={() => {
                    setActiveTab('places');
                    startEditPlace(place);
                  }}
                >
                  <div className={`activity-dot ${i === 0 ? 'active' : ''}`}></div>
                  <div className="activity-info">
                    <p className="activity-name">{place.name}</p>
                    <p className="activity-time">Actualizado hace {i + 1}h</p>
                  </div>
                  <div className="activity-action">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
