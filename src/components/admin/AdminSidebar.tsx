import React from 'react';
import { 
  Palmtree, Globe, LayoutDashboard, MapPin, ImageIcon, User as UserIcon, 
  Layers, Map as MapIcon, Users, Bell, Download, UploadCloud, Settings, 
  HelpCircle, LogOut, X
} from 'lucide-react';
import { User } from '../../types';
import { ElegantImage } from '../ElegantImage';
import { optimizeImageUrl } from '../../utils/image';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  navigate: (path: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  user: User | null;
  userRole: string | null;
  unreadCount: number;
  markNotificationsAsRead: () => void;
  handleLogout: () => void;
  handleExportData: () => void;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  navigate,
  isSidebarOpen,
  setIsSidebarOpen,
  user,
  userRole,
  unreadCount,
  markNotificationsAsRead,
  handleLogout,
  handleExportData,
  handleImportData
}: AdminSidebarProps) {
  return (
    <aside className={`admin-sidebar ${isSidebarOpen ? '' : 'closed'}`}>
      <div className="admin-sidebar-scroll">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl shadow-orange-500/20">
            <Palmtree className="w-8 h-8 text-white" />
          </div>
          <div className="mt-4 px-1">
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">ANTIGRAVITY</h1>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Management</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-title">Menú Principal</p>
          
          <button
            onClick={() => navigate('/')}
            className="sidebar-btn"
          >
            <Globe className="w-5 h-5" />
            <span>Inicio</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
            className={`sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('places'); setIsSidebarOpen(false); }}
            className={`sidebar-btn ${activeTab === 'places' ? 'active' : ''}`}
          >
            <MapPin className="w-5 h-5" />
            <span>Lugares</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('media'); setIsSidebarOpen(false); }}
            className={`sidebar-btn ${activeTab === 'media' ? 'active' : ''}`}
          >
            <ImageIcon className="w-5 h-5" />
            <span>Multimedia</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
            className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <UserIcon className="w-5 h-5" />
            <span>Mi Perfil</span>
          </button>

          {userRole === 'admin' && (
            <>
              <p className="sidebar-title">Administración</p>
              <button
                onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
                className={`sidebar-btn ${activeTab === 'categories' ? 'active' : ''}`}
              >
                <Layers className="w-5 h-5" />
                <span>Categorías</span>
              </button>
              
              <button
                onClick={() => { setActiveTab('communes'); setIsSidebarOpen(false); }}
                className={`sidebar-btn ${activeTab === 'communes' ? 'active' : ''}`}
              >
                <MapIcon className="w-5 h-5" />
                <span>Comunas</span>
              </button>
              
              <button
                onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
              >
                <Users className="w-5 h-5" />
                <span>Usuarios</span>
              </button>
              
              <button
                onClick={() => { 
                  setActiveTab('notifications'); 
                  setIsSidebarOpen(false); 
                  markNotificationsAsRead();
                }}
                className={`sidebar-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <Bell className="w-5 h-5" />
                  <span>Notificaciones</span>
                </div>
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </button>
            </>
          )}

          <p className="sidebar-title">General</p>
          {userRole === 'admin' && (
            <>
              <button
                onClick={handleExportData}
                className="sidebar-btn"
              >
                <Download className="w-5 h-5" />
                <span>Exportar Backup</span>
              </button>
              
              <label className="sidebar-btn" style={{ cursor: 'pointer' }}>
                <UploadCloud className="w-5 h-5" />
                <span>Importar Datos</span>
                <input type="file" style={{ display: 'none' }} accept=".json" onChange={handleImportData} />
              </label>
              
              <button 
                onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`}
              >
                <Settings className="w-5 h-5" />
                <span>Ajustes</span>
              </button>
            </>
          )}
          
          <button 
            onClick={() => { setActiveTab('help'); setIsSidebarOpen(false); }}
            className={`sidebar-btn ${activeTab === 'help' ? 'active' : ''}`}
          >
            <HelpCircle className="w-5 h-5" />
            <span>Ayuda</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="sidebar-btn danger"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </nav>

        <div className="sidebar-user-card">
          <div className="user-card-inner">
            <div className="user-avatar-wrapper">
              {user?.avatar_url ? (
                <ElegantImage 
                  src={optimizeImageUrl(user.avatar_url, 100)} 
                  alt="" 
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                  <UserIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.full_name || 'Usuario'}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
