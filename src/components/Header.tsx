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
import './Header.css';

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
      <header className="header-container glass animate-fade-in">
        <div className="header-content">
          <div className="profile-section">
            <Link to="/perfil" className="profile-pic">
              {user?.avatar_url ? (
                <ElegantImage 
                  src={optimizeImageUrl(user.avatar_url, 160)} 
                  alt="Profile" 
                  className="profile-pic-image"
                  containerClassName="profile-pic-image" // Ensure container matches
                  sizes="48px"
                />
              ) : (
                <User className="profile-pic-image" style={{ width: '1.75rem', height: '1.75rem', color: 'var(--text-muted)' }} />
              )}
            </Link>
            <div className="profile-info">
              <Link to="/perfil" className="profile-greeting">
                <h2 className="profile-name">
                  Hola, {(user?.full_name?.split(' ')[0]) || 'Invitado'}
                </h2>
              </Link>
              <button 
                onClick={() => refreshLocation()}
                disabled={locationLoading}
                className="location-btn"
              >
                <MapPin className={`location-icon ${locationLoading ? 'loading' : ''}`} />
                <span className="location-text">{displayAddress}</span>
              </button>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={toggleTheme}
              className="action-btn"
            >
              {isDark ? <Sun style={{ width: '1.25rem' }} /> : <Moon style={{ width: '1.25rem' }} />}
            </button>
            <button 
              onClick={() => {
                setIsNotificationModalOpen(true);
                markNotificationsAsRead();
              }}
              className="action-btn"
            >
              <Bell style={{ width: '1.25rem' }} />
              {unreadCount > 0 && (
                <span className="badge">
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
