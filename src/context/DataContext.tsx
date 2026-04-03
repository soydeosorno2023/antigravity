import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Category, Place, AppSettings, Commune, AppNotification } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  categories: Category[];
  featured: Place[];
  appSettings: AppSettings | null;
  communes: Commune[];
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markNotificationsAsRead: () => void;
}

const DataContext = createContext<DataContextType>({
  categories: [],
  featured: [],
  appSettings: null,
  communes: [],
  notifications: [],
  unreadCount: 0,
  loading: true,
  markNotificationsAsRead: () => {},
});

export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>(() => {
    const cached = localStorage.getItem('cached_categories');
    return cached ? JSON.parse(cached) : [];
  });
  const [featured, setFeatured] = useState<Place[]>(() => {
    const cached = localStorage.getItem('cached_featured');
    return cached ? JSON.parse(cached) : [];
  });
  const [appSettings, setAppSettings] = useState<AppSettings | null>(() => {
    const cached = localStorage.getItem('cached_settings');
    return cached ? JSON.parse(cached) : null;
  });
  const [communes, setCommunes] = useState<Commune[]>(() => {
    const cached = localStorage.getItem('cached_communes');
    return cached ? JSON.parse(cached) : [];
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(() => {
    const hasCategories = localStorage.getItem('cached_categories');
    const hasFeatured = localStorage.getItem('cached_featured');
    return !(hasCategories && hasFeatured);
  });
  const [localLastRead, setLocalLastRead] = useState<string | null>(() => localStorage.getItem('last_read_notifications_at'));

  const unreadCount = useMemo(() => {
    // Prioritize user's last read from Firestore, fallback to local storage for guests
    const lastRead = user?.last_read_notifications_at || localLastRead;
    
    if (!lastRead) return notifications.length;
    
    try {
      const lastReadTime = new Date(lastRead).getTime();
      if (isNaN(lastReadTime)) return notifications.length;

      return notifications.filter(n => {
        if (!n.created_at) return false;
        const createdAt = new Date(n.created_at).getTime();
        if (isNaN(createdAt)) return false;
        return createdAt > lastReadTime;
      }).length;
    } catch (e) {
      console.error("Error calculating unreadCount:", e);
      return notifications.length;
    }
  }, [notifications, user?.last_read_notifications_at, localLastRead]);

  const markNotificationsAsRead = async () => {
    const now = new Date().toISOString();
    try {
      if (user) {
        if (updateUser) {
          await updateUser({ last_read_notifications_at: now });
        }
      } else {
        localStorage.setItem('last_read_notifications_at', now);
        setLocalLastRead(now);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  useEffect(() => {
    // Safety timeout to prevent infinite loading - reduced to 2s for faster perceived load
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Subscribe to categories
    const unsubCategories = api.subscribeToCategories((cats) => {
      clearTimeout(safetyTimeout);
      setCategories(cats);
      localStorage.setItem('cached_categories', JSON.stringify(cats));
      setLoading(false);
    });

    // Subscribe to featured places
    const unsubFeatured = api.subscribeToPlaces({ featured: true }, (places) => {
      setFeatured(places);
      localStorage.setItem('cached_featured', JSON.stringify(places));
    });

    // Subscribe to global settings
    const unsubSettings = api.subscribeToSettings((settings) => {
      setAppSettings(settings);
      if (settings) localStorage.setItem('cached_settings', JSON.stringify(settings));
    });
    
    // Subscribe to communes
    const unsubCommunes = api.subscribeToCommunes((communeList) => {
      setCommunes(communeList);
      try {
        localStorage.setItem('cached_communes', JSON.stringify(communeList));
      } catch (e) {
        console.error('Error caching communes:', e);
      }
    });

    // Subscribe to notifications
    const unsubNotifications = api.subscribeToNotifications((allNotifications) => {
      setNotifications(allNotifications.filter(n => n.is_active));
    }, true);

    return () => {
      clearTimeout(safetyTimeout);
      unsubCategories();
      unsubFeatured();
      unsubSettings();
      unsubCommunes();
      unsubNotifications();
    };
  }, []);

  return (
    <DataContext.Provider value={{ 
      categories, 
      featured, 
      appSettings, 
      communes, 
      notifications, 
      unreadCount,
      loading,
      markNotificationsAsRead
    }}>
      {children}
    </DataContext.Provider>
  );
};
