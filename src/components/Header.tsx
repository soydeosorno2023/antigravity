import React, { useState } from 'react';
import { Link, useLocation as useRouterLocation } from 'react-router-dom';
import { User, MapPin, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationModal } from './NotificationModal';
import { ElegantImage } from './ElegantImage';
import { optimizeImageUrl } from '../utils/image';

export function Header() {
  const { user } = useAuth();
  const { address: userAddress, refreshLocation, locationLoading } = useLocation();
  const { unreadCount, markNotificationsAsRead, notifications } = useData();
  const { isDark, toggleTheme } = useTheme();
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const routerLocation = useRouterLocation();

  // Don't show header on admin dashboard
  // if (routerLocation.pathname.startsWith('/admin')) {
  //   return null;
  // }

  const displayAddress = (userAddress && userAddress !== 'OSORNO') 
    ? userAddress 
    : (user?.address || userAddress || 'Osorno, Chile');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F8F9FB]/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800/50 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link to="/perfil" className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {user?.avatar_url ? (
                <ElegantImage 
                  src={optimizeImageUrl(user.avatar_url, 160)} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                  sizes="48px"
                />
              ) : (
                <User className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link to="/perfil" className="block group">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate group-hover:text-[#F5B027] transition-colors">
                  Hola, {(user?.full_name?.split(' ')[0]) || 'Invitado'}
                </h2>
              </Link>
              <button 
                onClick={() => refreshLocation()}
                disabled={locationLoading}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 min-w-0 hover:text-[#F5B027] dark:hover:text-[#F5B027] transition-colors group text-left"
              >
                <MapPin className={`w-3 h-3 flex-shrink-0 ${locationLoading ? 'animate-bounce text-[#F5B027]' : ''}`} />
                <span className="text-xs font-medium truncate flex-1 max-w-[150px]">{displayAddress}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="w-11 h-11 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => {
                setIsNotificationModalOpen(true);
                markNotificationsAsRead();
              }}
              className="w-11 h-11 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 relative"
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <NotificationModal 
        isOpen={isNotificationModalOpen} 
        onClose={() => setIsNotificationModalOpen(false)} 
        notifications={notifications}
      />
    </>
  );
}
