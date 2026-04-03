import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';
import { api } from '../services/api';
import { safeLocalStorage, safeSessionStorage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  loginWithFacebook: (rememberMe?: boolean) => Promise<void>;
  sendPhoneCode: (phoneNumber: string, recaptchaVerifier: any) => Promise<any>;
  verifyPhoneCode: (confirmationResult: any, code: string) => Promise<void>;
  isLoggingIn: boolean;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isOwner: false,
  loginWithGoogle: async () => {},
  loginWithFacebook: async () => {},
  sendPhoneCode: async () => {},
  verifyPhoneCode: async () => {},
  isLoggingIn: false,
  logout: async () => {},
  updateUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      // Safety timeout to prevent infinite loading
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
      }, 5000);

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // Listen to changes in real-time
          unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            clearTimeout(safetyTimeout);
            if (docSnap.exists()) {
              setUser({ id: firebaseUser.uid, ...docSnap.data() } as User);
            } else {
              // Verificar si es un dueño anónimo
              const storedRole = safeLocalStorage.getItem('user_role') || safeSessionStorage.getItem('user_role');
              if (firebaseUser.isAnonymous && storedRole === 'owner') {
                setUser({
                  id: firebaseUser.uid,
                  username: 'dueño',
                  role: 'owner',
                  full_name: 'Dueño de Local',
                  email: '',
                } as User);
              } else {
                // If user exists in Auth but not in Firestore (e.g. first login)
                setUser({
                  id: firebaseUser.uid,
                  username: firebaseUser.email?.split('@')[0] || 'user',
                  role: 'user',
                  full_name: firebaseUser.displayName || 'User',
                  email: firebaseUser.email || '',
                  avatar_url: firebaseUser.photoURL || undefined
                } as User);
              }
            }
            setLoading(false);
          }, (err) => {
            clearTimeout(safetyTimeout);
            console.error("Error listening to user profile:", err);
            setLoading(false);
          });
        } catch (err) {
          clearTimeout(safetyTimeout);
          console.error("Error setting up user profile listener:", err);
          setUser(null);
          setLoading(false);
        }
      } else {
        clearTimeout(safetyTimeout);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const loginWithGoogle = async (rememberMe: boolean = true) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const result = await api.loginWithGoogle();
      if (!result) return;
      const { token, role } = result;
      const storage = rememberMe ? safeLocalStorage : safeSessionStorage;
      storage.setItem('auth_token', token);
      storage.setItem('user_role', role);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithFacebook = async (rememberMe: boolean = true) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const result = await api.loginWithFacebook();
      if (!result) return;
      const { token, role } = result;
      const storage = rememberMe ? safeLocalStorage : safeSessionStorage;
      storage.setItem('auth_token', token);
      storage.setItem('user_role', role);
    } catch (error: any) {
      console.error("Error signing in with Facebook:", error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const sendPhoneCode = async (phoneNumber: string, recaptchaVerifier: any) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      return await api.sendPhoneCode(phoneNumber, recaptchaVerifier);
    } catch (error: any) {
      console.error("Error sending phone code:", error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const verifyPhoneCode = async (confirmationResult: any, code: string) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const result = await api.verifyPhoneCode(confirmationResult, code);
      if (!result) return;
      const { token, role } = result;
      safeLocalStorage.setItem('auth_token', token);
      safeLocalStorage.setItem('user_role', role);
    } catch (error: any) {
      console.error("Error verifying phone code:", error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      safeLocalStorage.removeItem('auth_token');
      safeLocalStorage.removeItem('user_role');
      safeSessionStorage.removeItem('auth_token');
      safeSessionStorage.removeItem('user_role');
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.id);
      const { id: _, ...rest } = data as any;
      await setDoc(userDocRef, rest, { merge: true });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    isOwner: user?.role === 'owner' || user?.role === 'admin',
    loginWithGoogle,
    loginWithFacebook,
    sendPhoneCode,
    verifyPhoneCode,
    isLoggingIn,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
