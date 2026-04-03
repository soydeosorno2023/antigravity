import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../services/api';

interface LikesContextType {
  likes: string[];
  toggleLike: (placeId: string, menuItemId: string) => Promise<void>;
  isLiked: (placeId: string, menuItemId: string) => boolean;
  loading: boolean;
  user: User | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const [likes, setLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubscribe) unsubscribe();
      
      if (firebaseUser) {
        unsubscribe = api.subscribeToLikes(firebaseUser.uid, (likeIds) => {
          setLikes(likeIds);
          setLoading(false);
        });
      } else {
        setLikes([]);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const toggleLike = async (placeId: string, menuItemId: string) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    try {
      await api.toggleLike(placeId, menuItemId);
    } catch (err: any) {
      console.error("Toggle like error:", err);
    }
  };

  const isLiked = (placeId: string, menuItemId: string) => likes.includes(`${placeId}_${menuItemId}`);

  return (
    <LikesContext.Provider value={{ 
      likes, 
      toggleLike, 
      isLiked, 
      loading, 
      user, 
      isLoginModalOpen, 
      setIsLoginModalOpen 
    }}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);
  if (context === undefined) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
}
