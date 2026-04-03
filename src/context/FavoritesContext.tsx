import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../services/api';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  loading: boolean;
  user: User | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubscribe) unsubscribe();
      
      if (firebaseUser) {
        unsubscribe = api.subscribeToFavorites(firebaseUser.uid, (placeIds) => {
          setFavorites(placeIds);
          setLoading(false);
        });
      } else {
        setFavorites([]);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const toggleFavorite = async (id: string) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    try {
      await api.toggleFavorite(id);
    } catch (err: any) {
      console.error("Toggle favorite error:", err);
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      toggleFavorite, 
      isFavorite, 
      loading, 
      user, 
      isLoginModalOpen, 
      setIsLoginModalOpen 
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
