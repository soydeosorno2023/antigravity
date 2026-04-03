import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch, 
  increment,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  signInAnonymously
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { logSecurityEvent } from './securityService';
import { Category, Subcategory, Place, Tour, Review, User, AppSettings, Favorite, Media, Commune, AppNotification, MenuItem } from '../types';
import { safeLocalStorage, safeSessionStorage } from '../utils/storage';
import { convertToWebP } from '../utils/image';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow: boolean = true) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (errInfo.error.includes('Missing or insufficient permissions')) {
    logSecurityEvent(operationType, path, errInfo.error).catch(e => console.error('Failed to log security event:', e));
  }

  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export const api = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const path = 'categories';
    try {
      const q = query(collection(db, path), orderBy('order_index', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  async createCategory(token: string, data: Partial<Category>): Promise<any> {
    const path = 'categories';
    try {
      const docRef = await addDoc(collection(db, path), data);
      return { id: docRef.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateCategory(token: string, id: string, data: Partial<Category>): Promise<any> {
    const path = `categories/${id}`;
    try {
      const { id: _, ...rest } = data;
      await updateDoc(doc(db, 'categories', id), rest);
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteCategory(token: string, id: string): Promise<any> {
    const path = `categories/${id}`;
    try {
      // 1. Delete associated subcategories
      const subSnapshot = await getDocs(query(collection(db, 'subcategories'), where('category_id', '==', id)));
      const subDeletions = subSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(subDeletions);

      // 2. Delete associated places
      const placesSnapshot = await getDocs(query(collection(db, 'places'), where('category_id', '==', id)));
      const placeDeletions = placesSnapshot.docs.map(doc => this.deletePlace(token, doc.id));
      await Promise.all(placeDeletions);

      // 3. Delete the category itself
      await deleteDoc(doc(db, 'categories', id));
      
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Subcategories
  async getSubcategories(categoryId?: string): Promise<Subcategory[]> {
    const path = 'subcategories';
    try {
      let q = query(collection(db, path), orderBy('order_index', 'asc'));
      if (categoryId) {
        q = query(q, where('category_id', '==', categoryId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subcategory));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  subscribeToSubcategories(callback: (subcategories: Subcategory[]) => void): () => void {
    const path = 'subcategories';
    const q = query(collection(db, path), orderBy('order_index', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const subcategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subcategory));
      callback(subcategories);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  async createSubcategory(token: string, data: Partial<Subcategory>): Promise<any> {
    const path = 'subcategories';
    try {
      const docRef = await addDoc(collection(db, path), data);
      return { id: docRef.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateSubcategory(token: string, id: string, data: Partial<Subcategory>): Promise<any> {
    const path = `subcategories/${id}`;
    try {
      const { id: _, ...rest } = data;
      await updateDoc(doc(db, 'subcategories', id), rest);
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteSubcategory(token: string, id: string): Promise<any> {
    const path = `subcategories/${id}`;
    try {
      // 1. Delete associated places
      const placesSnapshot = await getDocs(query(collection(db, 'places'), where('subcategory_id', '==', id)));
      const placeDeletions = placesSnapshot.docs.map(doc => this.deletePlace(token, doc.id));
      await Promise.all(placeDeletions);

      // 2. Delete the subcategory itself
      await deleteDoc(doc(db, 'subcategories', id));
      
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Places
  async getPlaces(params?: { category?: string; featured?: boolean; hasInstagram?: boolean }): Promise<Place[]> {
    const path = 'places';
    try {
      let q = query(collection(db, path), where('is_active', 'in', [1, true]));
      
      if (params?.category) {
        const catSnap = await getDocs(query(collection(db, 'categories'), where('slug', '==', params.category)));
        if (!catSnap.empty) {
          q = query(q, where('category_id', '==', catSnap.docs[0].id));
        }
      }
      
      if (params?.featured) {
        q = query(q, where('is_featured', 'in', [1, true]));
      }

      if (params?.hasInstagram) {
        // We can't query for "field exists" in Firestore easily, but we can check if a field is not empty
        // However, for simplicity and performance, we'll just fetch a larger number of places
        // and filter them. 100 should be enough to find those with Instagram.
        q = query(q, limit(100)); 
      }

      const snapshot = await getDocs(q);
      let places = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place));

      if (params?.hasInstagram) {
        places = places.filter(p => p.instagram_access_token && p.instagram_user_id);
      }

      return places;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  subscribeToCategories(callback: (categories: Category[]) => void): () => void {
    const path = 'categories';
    const q = query(collection(db, path), orderBy('order_index', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      callback(categories);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  subscribeToPlaces(params: { categoryId?: string; featured?: boolean; admin?: boolean; ownerId?: string; assignedPlaceId?: string }, callback: (places: Place[]) => void): () => void {
    const path = 'places';
    
    // If we have a specific assignedPlaceId, we can just fetch that document directly
    // This is useful for owners whose owner_id might not be correctly set on the place yet
    if (params.assignedPlaceId) {
      return onSnapshot(doc(db, path, params.assignedPlaceId), (docSnap) => {
        if (docSnap.exists()) {
          callback([{ id: docSnap.id, ...docSnap.data() } as Place]);
        } else {
          callback([]);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, path, false);
      });
    }

    let q = query(collection(db, path));
    
    if (!params.admin) {
      q = query(q, where('is_active', 'in', [1, true]));
    }

    if (params.ownerId) {
      q = query(q, where('owner_id', '==', params.ownerId));
    }
    
    if (params.categoryId) {
      q = query(q, where('category_id', '==', params.categoryId));
    }
    
    if (params.featured) {
      q = query(q, where('is_featured', 'in', [1, true]));
    }

    return onSnapshot(q, (snapshot) => {
      const places = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place));
      callback(places);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  subscribeToTours(placeId: string, callback: (tours: Tour[]) => void): () => void {
    const path = 'tours';
    const q = query(collection(db, path), where('place_id', '==', placeId));
    return onSnapshot(q, (snapshot) => {
      const tours = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tour));
      callback(tours);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  subscribeToReviews(placeId: string, callback: (reviews: Review[]) => void): () => void {
    const path = 'reviews';
    const q = query(collection(db, path), where('place_id', '==', placeId), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
        } as Review;
      });
      callback(reviews);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  async searchPlaces(queryStr: string): Promise<Place[]> {
    const path = 'places';
    try {
      // Firestore doesn't support full-text search natively well without Algolia/Elastic
      // We'll do a simple prefix search or just fetch all and filter client-side for now
      // or use a simple where clause if possible.
      const snapshot = await getDocs(collection(db, path));
      const allPlaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place));
      const lowerQuery = queryStr.toLowerCase();
      return allPlaces.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.full_description.toLowerCase().includes(lowerQuery) ||
        (p.category_name && p.category_name.toLowerCase().includes(lowerQuery)) ||
        (p.subcategory_name && p.subcategory_name.toLowerCase().includes(lowerQuery)) ||
        (p.address && p.address.toLowerCase().includes(lowerQuery)) ||
        (p.phone && p.phone.toLowerCase().includes(lowerQuery)) ||
        (p.whatsapp && p.whatsapp.toLowerCase().includes(lowerQuery)) ||
        (p.website && p.website.toLowerCase().includes(lowerQuery)) ||
        (p.hours && p.hours.toLowerCase().includes(lowerQuery)) ||
        (p.instagram_username && p.instagram_username.toLowerCase().includes(lowerQuery))
      ).slice(0, 10);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  async getPlace(id: string): Promise<Place> {
    const path = `places/${id}`;
    try {
      const docSnap = await getDoc(doc(db, 'places', id));
      if (!docSnap.exists()) throw new Error('Place not found');
      return { id: docSnap.id, ...docSnap.data() } as Place;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      throw err;
    }
  },

  async getPlaceSecrets(id: string): Promise<any> {
    const path = `place_secrets/${id}`;
    try {
      const docSnap = await getDoc(doc(db, 'place_secrets', id));
      if (!docSnap.exists()) return null;
      return docSnap.data();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path, false);
      return null;
    }
  },

  async getPlaceBySlug(slug: string): Promise<Place> {
    const path = 'places';
    try {
      const q = query(collection(db, path), where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error('Place not found');
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Place;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      throw err;
    }
  },

  async getMyPlaces(token: string): Promise<Place[]> {
    const path = 'places';
    try {
      if (!auth.currentUser) return [];
      const q = query(collection(db, path), where('owner_id', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  async createPlace(token: string, data: any): Promise<any> {
    const path = 'places';
    try {
      const normalizedData: any = { ...data };
      
      if (data.is_active !== undefined) {
        normalizedData.is_active = data.is_active ? 1 : 0;
      } else {
        normalizedData.is_active = 1; // Default to active
      }
      
      if (data.is_featured !== undefined) {
        normalizedData.is_featured = data.is_featured ? 1 : 0;
      } else {
        normalizedData.is_featured = 0; // Default to not featured
      }

      // Only add owner_id if it's provided or if we want to set it to current user
      if (data.owner_id) {
        normalizedData.owner_id = data.owner_id;
      } else if (auth.currentUser?.uid) {
        // If it's an owner creating it, set them as owner. If admin, they can leave it empty.
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.data()?.role === 'owner') {
          normalizedData.owner_id = auth.currentUser.uid;
        }
      }

      // Clean undefined values
      Object.keys(normalizedData).forEach(key => {
        if (normalizedData[key] === undefined) {
          delete normalizedData[key];
        }
      });

      const allowedFields = [
        'category_id', 'subcategory_id', 'owner_id', 'owner_username', 'owner_custom_username', 'name', 'full_description', 'profile_image_url', 
        'cover_image_url', 'gallery', 'address', 'lat', 'lng', 'phone', 'whatsapp', 
        'website', 'hours', 'youtube_video_url', 'slug', 'is_featured', 'is_active',
        'favorites_count', 'category_name', 'subcategory_name',
        'is_pet_friendly', 'has_parking', 'has_wifi', 'has_menu',
        'instagram_access_token', 'instagram_user_id', 'instagram_username', 'instagram_token_expires_at',
        'created_at', 'updated_at'
      ];
      const filteredData: any = {};
      allowedFields.forEach(field => {
        if (field in normalizedData && normalizedData[field] !== undefined) {
          filteredData[field] = normalizedData[field];
        }
      });

      const docRef = await addDoc(collection(db, path), filteredData);
      
      // If there are instagram secrets or owner password, save them to place_secrets
      if (filteredData.instagram_access_token || filteredData.instagram_user_id || filteredData.instagram_username || filteredData.instagram_token_expires_at || data.owner_password) {
        const secretData: any = {
          instagram_access_token: filteredData.instagram_access_token || null,
          instagram_user_id: filteredData.instagram_user_id || null,
          instagram_username: filteredData.instagram_username || null,
          instagram_token_expires_at: filteredData.instagram_token_expires_at || null,
        };
        if (data.owner_password !== undefined) {
          secretData.owner_password = data.owner_password;
        }
        await setDoc(doc(db, 'place_secrets', docRef.id), secretData);
      }

      return { id: docRef.id, ...filteredData };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updatePlace(token: string, id: string, data: any): Promise<any> {
    const path = `places/${id}`;
    try {
      const { id: _, ...rest } = data;
      const normalizedData: any = { ...rest };
      
      if (data.is_active !== undefined) {
        normalizedData.is_active = data.is_active ? 1 : 0;
      }
      
      if (data.is_featured !== undefined) {
        normalizedData.is_featured = data.is_featured ? 1 : 0;
      }

      // Clean undefined values
      Object.keys(normalizedData).forEach(key => {
        if (normalizedData[key] === undefined) {
          delete normalizedData[key];
        }
      });

      const allowedFields = [
        'category_id', 'subcategory_id', 'owner_id', 'owner_username', 'owner_custom_username', 'name', 'full_description', 'profile_image_url', 
        'cover_image_url', 'gallery', 'address', 'lat', 'lng', 'phone', 'whatsapp', 
        'website', 'hours', 'youtube_video_url', 'slug', 'is_featured', 'is_active',
        'favorites_count', 'category_name', 'subcategory_name',
        'is_pet_friendly', 'has_parking', 'has_wifi', 'has_menu',
        'instagram_access_token', 'instagram_user_id', 'instagram_username', 'instagram_token_expires_at',
        'created_at', 'updated_at'
      ];
      const filteredData: any = {};
      allowedFields.forEach(field => {
        if (field in normalizedData && normalizedData[field] !== undefined) {
          filteredData[field] = normalizedData[field];
        }
      });

      await updateDoc(doc(db, 'places', id), filteredData);
      
      // If there are instagram secrets or owner password, save them to place_secrets
      if (normalizedData.instagram_access_token || normalizedData.instagram_user_id || normalizedData.instagram_username || normalizedData.instagram_token_expires_at || data.owner_password) {
        const secretData: any = {
          instagram_access_token: normalizedData.instagram_access_token || null,
          instagram_user_id: normalizedData.instagram_user_id || null,
          instagram_username: normalizedData.instagram_username || null,
          instagram_token_expires_at: normalizedData.instagram_token_expires_at || null,
        };
        if (data.owner_password !== undefined) {
          secretData.owner_password = data.owner_password;
        }
        await setDoc(doc(db, 'place_secrets', id), secretData, { merge: true });
      }

      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deletePlace(token: string, id: string): Promise<any> {
    const path = `places/${id}`;
    try {
      // 1. Delete Menu Items (subcollection)
      const menuSnapshot = await getDocs(collection(db, 'places', id, 'menu'));
      const menuDeletions = menuSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(menuDeletions);

      // 2. Delete Tours
      const toursSnapshot = await getDocs(query(collection(db, 'tours'), where('place_id', '==', id)));
      const tourDeletions = toursSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(tourDeletions);

      // 3. Delete Reviews
      const reviewsSnapshot = await getDocs(query(collection(db, 'reviews'), where('place_id', '==', id)));
      const reviewDeletions = reviewsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(reviewDeletions);

      // 4. Delete Favorites
      const favoritesSnapshot = await getDocs(query(collection(db, 'favorites'), where('place_id', '==', id)));
      const favoriteDeletions = favoritesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(favoriteDeletions);

      // 5. Delete the Place itself
      await deleteDoc(doc(db, 'places', id));
      
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async getMedia(): Promise<Media[]> {
    const path = 'media';
    try {
      const q = query(collection(db, path), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
        } as Media;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  subscribeToMedia(callback: (media: Media[]) => void, userId?: string) {
    const path = 'media';
    let q = query(collection(db, path), orderBy('created_at', 'desc'));
    
    if (userId) {
      q = query(collection(db, path), where('user_id', '==', userId), orderBy('created_at', 'desc'));
    }

    return onSnapshot(q, (snapshot) => {
      const media = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
        } as Media;
      });
      callback(media);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  async deleteMedia(token: string, media: Media): Promise<void> {
    try {
      // 1. Delete from Storage
      const storageRef = ref(storage, media.path);
      await deleteObject(storageRef);

      // 2. Delete from Firestore
      await deleteDoc(doc(db, 'media', media.id));
    } catch (err) {
      console.error("Error deleting media:", err);
      throw err;
    }
  },

  // Auth
  async login(usernameOrEmail: string, password: string): Promise<{ token: string; role: string; user: any }> {
    try {
      const cleanUsernameOrEmail = usernameOrEmail.trim();
      // Recortar la contraseña para consistencia con el panel de administración
      const cleanPassword = password.trim();

      if (!cleanUsernameOrEmail || !cleanPassword) {
        const error: any = new Error('Usuario y contraseña son requeridos');
        error.code = 'auth/invalid-email';
        throw error;
      }

      let email = cleanUsernameOrEmail;

      // Si no parece un email, buscar por username
      if (!cleanUsernameOrEmail.includes('@')) {
        const usersRef = collection(db, 'users');
        // Intentar búsqueda exacta y en minúsculas para el username
        const q = query(usersRef, where('username', 'in', [cleanUsernameOrEmail, cleanUsernameOrEmail.toLowerCase()]), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          email = userData.email;
        } else {
          // Si no se encuentra el username, lanzar un error específico
          const error: any = new Error('El usuario no existe');
          error.code = 'auth/user-not-found';
          throw error;
        }
      }

      console.log(`Intentando login para: ${email}`);

      // Validar formato de email antes de enviarlo a Firebase
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const error: any = new Error('El formato del correo electrónico es inválido');
        error.code = 'auth/invalid-email';
        throw error;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, cleanPassword);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      const role = userData?.role || 'user';
      if (role !== 'admin' && role !== 'owner') {
        throw new Error('No tienes permisos para acceder al panel de administración');
      }

      return { 
        token: await userCredential.user.getIdToken(), 
        role: role,
        user: { id: userCredential.user.uid, ...userData }
      };
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  },

  _isLoggingIn: false,
  async loginWithGoogle(): Promise<{ token: string; role: string; user: any }> {
    if (this._isLoggingIn) {
      throw new Error('Login already in progress');
    }
    this._isLoggingIn = true;
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if user document exists, if not create it
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (err: any) {
        // Retry once after a short delay to handle potential auth token propagation race conditions
        if (err.code === 'permission-denied') {
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            userDoc = await getDoc(userDocRef);
          } catch (retryErr) {
            handleFirestoreError(retryErr, OperationType.GET, `users/${userCredential.user.uid}`);
            throw retryErr;
          }
        } else {
          handleFirestoreError(err, OperationType.GET, `users/${userCredential.user.uid}`);
          throw err;
        }
      }
      
      let userData = userDoc.data();
      
      if (!userDoc.exists()) {
        const email = userCredential.user.email || '';
        const role = email === 'zonasur2011@gmail.com' ? 'admin' : 'user';
        
        userData = {
          id: userCredential.user.uid,
          username: email.split('@')[0] || 'user',
          full_name: userCredential.user.displayName || 'User',
          email: email,
          role: role,
          avatar_url: userCredential.user.photoURL || null,
          created_at: serverTimestamp()
        };
        
        try {
          await setDoc(userDocRef, userData);
        } catch (err: any) {
          if (err.code === 'permission-denied') {
            await new Promise(resolve => setTimeout(resolve, 500));
            try {
              await setDoc(userDocRef, userData);
            } catch (retryErr) {
              handleFirestoreError(retryErr, OperationType.CREATE, `users/${userCredential.user.uid}`);
              throw retryErr;
            }
          } else {
            handleFirestoreError(err, OperationType.CREATE, `users/${userCredential.user.uid}`);
            throw err;
          }
        }
      }

      return { 
        token: await userCredential.user.getIdToken(), 
        role: userData?.role || 'user',
        user: { id: userCredential.user.uid, ...userData }
      };
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request') {
        console.warn("Google login popup request was cancelled by a newer request.");
        return null;
      } else if (err.code === 'auth/popup-closed-by-user') {
        console.warn("Google login popup was closed by the user.");
        return null;
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error("Ya existe una cuenta con este correo electrónico. Por favor, inicia sesión con el método que usaste originalmente.");
      } else {
        console.error("Google login error:", err);
        throw err;
      }
    } finally {
      this._isLoggingIn = false;
    }
  },

  async loginWithFacebook(): Promise<{ token: string; role: string; user: any }> {
    if (this._isLoggingIn) {
      throw new Error('Login already in progress');
    }
    this._isLoggingIn = true;
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if user document exists, if not create it
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (err: any) {
        if (err.code === 'permission-denied') {
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            userDoc = await getDoc(userDocRef);
          } catch (retryErr) {
            handleFirestoreError(retryErr, OperationType.GET, `users/${userCredential.user.uid}`);
            throw retryErr;
          }
        } else {
          handleFirestoreError(err, OperationType.GET, `users/${userCredential.user.uid}`);
          throw err;
        }
      }
      
      let userData = userDoc.data();
      
      if (!userDoc.exists()) {
        const email = userCredential.user.email || '';
        const role = email === 'zonasur2011@gmail.com' ? 'admin' : 'user';
        
        userData = {
          id: userCredential.user.uid,
          username: email ? email.split('@')[0] : 'user',
          full_name: userCredential.user.displayName || 'User',
          email: email,
          role: role,
          avatar_url: userCredential.user.photoURL || null,
          created_at: serverTimestamp()
        };
        
        try {
          await setDoc(userDocRef, userData);
        } catch (err: any) {
          if (err.code === 'permission-denied') {
            await new Promise(resolve => setTimeout(resolve, 500));
            try {
              await setDoc(userDocRef, userData);
            } catch (retryErr) {
              handleFirestoreError(retryErr, OperationType.CREATE, `users/${userCredential.user.uid}`);
              throw retryErr;
            }
          } else {
            handleFirestoreError(err, OperationType.CREATE, `users/${userCredential.user.uid}`);
            throw err;
          }
        }
      }

      return { 
        token: await userCredential.user.getIdToken(), 
        role: userData?.role || 'user',
        user: { id: userCredential.user.uid, ...userData }
      };
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request') {
        console.warn("Facebook login popup request was cancelled by a newer request.");
        return null;
      } else if (err.code === 'auth/popup-closed-by-user') {
        console.warn("Facebook login popup was closed by the user.");
        return null;
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error("Ya existe una cuenta con este correo electrónico. Por favor, inicia sesión con el método que usaste originalmente.");
      } else {
        console.error("Facebook login error:", err);
        throw err;
      }
    } finally {
      this._isLoggingIn = false;
    }
  },

  async sendPhoneCode(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<any> {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      console.error("Error sending phone code:", error);
      throw error;
    }
  },

  async verifyPhoneCode(confirmationResult: any, code: string): Promise<{ token: string; role: string; user: any }> {
    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      const token = await user.getIdToken();
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let userData = userSnap.data();
      let role = 'user';
      
      if (!userSnap.exists()) {
        const phoneFormatted = user.phoneNumber ? user.phoneNumber.replace('+', '') : null;
        const dummyEmail = phoneFormatted 
          ? `${phoneFormatted}@telefono.com` 
          : `user_${user.uid.substring(0, 5)}@telefono.com`;

        userData = {
          id: user.uid,
          username: user.phoneNumber || 'usuario',
          full_name: 'Usuario App',
          email: dummyEmail,
          phone: user.phoneNumber,
          role: 'user',
          created_at: serverTimestamp(),
        };
        await setDoc(userRef, userData);
      } else {
        role = userData?.role || 'user';
      }
      
      return { token, role, user: { ...userData, id: user.uid } };
    } catch (error) {
      console.error("Error verifying phone code:", error);
      throw error;
    }
  },

  async register(data: any): Promise<{ token: string; role: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const userData = {
        username: data.username,
        full_name: data.full_name,
        email: data.email,
        role: data.role || 'user',
        avatar_url: data.avatar_url || null,
        id: userCredential.user.uid,
        created_at: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      return { 
        token: await userCredential.user.getIdToken(), 
        role: userData.role 
      };
    } catch (err) {
      throw err;
    }
  },

  async getMe(token: string): Promise<any> {
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      
      if (auth.currentUser.isAnonymous) {
        const storedRole = safeLocalStorage.getItem('user_role') || safeSessionStorage.getItem('user_role');
        if (storedRole === 'owner') {
          return {
            id: auth.currentUser.uid,
            username: 'dueño',
            role: 'owner',
            full_name: 'Dueño de Local',
            email: ''
          };
        }
      }

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      return { id: auth.currentUser.uid, ...userDoc.data() };
    } catch (err) {
      throw err;
    }
  },

  async getUsers(): Promise<User[]> {
    const path = 'users';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  },

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, 'users', userId), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async updateProfile(token: string, data: { full_name: string; email: string; avatar_url?: string; address?: string; phone?: string }): Promise<any> {
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      await updateDoc(doc(db, 'users', auth.currentUser.uid), data);
      if (data.full_name) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: data.full_name, photoURL: data.avatar_url });
      }
      return { success: true };
    } catch (err) {
      throw err;
    }
  },

  // Tours
  async getTours(placeId: string): Promise<Tour[]> {
    const path = 'tours';
    try {
      const q = query(collection(db, path), where('place_id', '==', placeId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tour));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  async createTour(token: string, data: any): Promise<any> {
    const path = 'tours';
    try {
      const docRef = await addDoc(collection(db, path), data);
      return { id: docRef.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async deleteTour(token: string, id: string): Promise<any> {
    const path = `tours/${id}`;
    try {
      await deleteDoc(doc(db, 'tours', id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Reviews
  async createReview(token: string, placeId: string, data: Partial<Review>): Promise<any> {
    const path = 'reviews';
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');

      // Check weekly limit
      const q = query(
        collection(db, 'reviews'),
        where('place_id', '==', placeId),
        where('user_id', '==', auth.currentUser.uid),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const lastReview = snapshot.docs[0].data();
        const lastReviewDate = lastReview.created_at instanceof Timestamp ? lastReview.created_at.toDate() : new Date(lastReview.created_at);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        if (lastReviewDate > oneWeekAgo) {
          throw new Error('Solo puedes dejar una reseña por semana.');
        }
      }

      const reviewData = {
        ...data,
        place_id: placeId,
        user_id: auth.currentUser.uid,
        user_name: auth.currentUser.displayName,
        user_avatar: auth.currentUser.photoURL,
        created_at: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, path), reviewData);
      return { id: docRef.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateReview(token: string, id: string, data: Partial<Review>): Promise<any> {
    const path = `reviews/${id}`;
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      
      // Ensure only comment and rating can be updated
      const { comment, rating } = data;
      await updateDoc(doc(db, 'reviews', id), {
        comment,
        rating,
        updated_at: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Menu Items
  async getMenuItems(placeId: string): Promise<MenuItem[]> {
    const path = `places/${placeId}/menu`;
    try {
      const q = query(collection(db, 'places', placeId, 'menu'), orderBy('order_index', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  async getMenuItem(placeId: string, menuItemId: string): Promise<MenuItem | null> {
    const path = `places/${placeId}/menu/${menuItemId}`;
    try {
      const docRef = doc(db, 'places', placeId, 'menu', menuItemId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as MenuItem;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  },

  subscribeToMenuItems(placeId: string, callback: (items: MenuItem[]) => void): () => void {
    const path = `places/${placeId}/menu`;
    // Removing orderBy to ensure items without order_index are also visible
    const q = query(collection(db, 'places', placeId, 'menu'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      // Sort in memory instead
      items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      callback(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  async createMenuItem(placeId: string, data: Partial<MenuItem>): Promise<any> {
    const path = `places/${placeId}/menu`;
    try {
      console.log('API: Creating menu item at path:', path, 'with data:', data);
      
      // Filter only allowed fields to avoid "Missing or insufficient permissions" 
      // caused by hasOnlyAllowedFields in firestore.rules
      const allowedFields = ['place_id', 'name', 'description', 'price', 'image_url', 'category', 'sizes', 'addons', 'is_available', 'order_index'];
      const filteredData: any = {
        place_id: placeId,
        is_available: data.is_available ?? true,
        order_index: data.order_index ?? 0
      };
      
      allowedFields.forEach(field => {
        if (field in data && data[field as keyof typeof data] !== undefined) {
          filteredData[field] = data[field as keyof typeof data];
        }
      });

      const docRef = await addDoc(collection(db, 'places', placeId, 'menu'), filteredData);
      console.log('API: Menu item created with ID:', docRef.id);
      return { id: docRef.id };
    } catch (err) {
      console.error('API Error creating menu item:', err);
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateMenuItem(placeId: string, id: string, data: Partial<MenuItem>): Promise<any> {
    const path = `places/${placeId}/menu/${id}`;
    try {
      // Filter only allowed fields
      const allowedFields = ['place_id', 'name', 'description', 'price', 'image_url', 'category', 'sizes', 'addons', 'is_available', 'order_index'];
      const filteredData: any = {};
      
      allowedFields.forEach(field => {
        if (field in data && data[field as keyof typeof data] !== undefined) {
          filteredData[field] = data[field as keyof typeof data];
        }
      });

      await updateDoc(doc(db, 'places', placeId, 'menu', id), filteredData);
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteMenuItem(placeId: string, id: string): Promise<any> {
    const path = `places/${placeId}/menu/${id}`;
    try {
      await deleteDoc(doc(db, 'places', placeId, 'menu', id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Reviews
  async getReviews(placeId: string): Promise<Review[]> {
    const path = 'reviews';
    try {
      const q = query(collection(db, path), where('place_id', '==', placeId), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
        } as Review;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  },

  // Images
  async uploadImage(token: string | null, file: File): Promise<{ url: string }> {
    if (!auth.currentUser) {
      console.error("Upload failed: No authenticated user found");
      throw new Error("No estás autenticado. Por favor, inicia sesión de nuevo.");
    }

    console.log(`Starting upload for file: ${file?.name}, size: ${file?.size} bytes`);
    
    let fileToUpload: File | Blob = file;
    let fileName = file?.name || 'image.jpg';
    
    // Convert to WebP if it's an image and not already WebP
    if (file?.type?.startsWith('image/') && file.type !== 'image/webp') {
      try {
        console.log('Converting image to WebP...');
        fileToUpload = await convertToWebP(file);
        // Change extension to .webp
        fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
        console.log(`Converted to WebP. New size: ${fileToUpload.size} bytes`);
      } catch (conversionError) {
        console.warn('Failed to convert to WebP, uploading original file:', conversionError);
      }
    }

    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `images/${Date.now()}_${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      // Set a timeout of 30 seconds
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error("La subida tardó demasiado tiempo. Verifica tu conexión o si Storage está activado."));
      }, 30000);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        }, 
        (error) => {
          clearTimeout(timeout);
          console.error("Firebase Storage Error:", error);
          let message = "Error al subir la imagen.";
          if (error.code === 'storage/unauthorized') {
            message = "No tienes permisos para subir archivos. Revisa las reglas de Storage.";
          } else if (error.code === 'storage/canceled') {
            message = "Subida cancelada o tiempo de espera agotado.";
          }
          reject(new Error(`${message} (${error.code})`));
        }, 
        async () => {
          clearTimeout(timeout);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const path = uploadTask.snapshot.ref.fullPath;
            
            // Save metadata to Firestore
            await addDoc(collection(db, 'media'), {
              url,
              name: fileName,
              path: path,
              size: fileToUpload.size,
              mime_type: fileToUpload.type || 'image/webp',
              user_id: auth.currentUser?.uid,
              created_at: serverTimestamp()
            });

            console.log("Upload successful, URL:", url);
            resolve({ url });
          } catch (urlErr) {
            console.error("Error getting download URL or saving metadata:", urlErr);
            reject(urlErr);
          }
        }
      );
    });
  },

  // Settings
  async getSettings(): Promise<AppSettings | null> {
    const path = 'settings/global';
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'global'));
      if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path, false);
      return null;
    }
  },

  async updateSettings(token: string, data: Partial<AppSettings>): Promise<any> {
    const path = 'settings/global';
    try {
      const { id: _, ...rest } = data as any;
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'global'), rest, { merge: true });
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  subscribeToSettings(callback: (settings: AppSettings) => void): () => void {
    const path = 'settings/global';
    return onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as AppSettings);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  // Favorites
  async toggleFavorite(placeId: string): Promise<boolean> {
    if (!auth.currentUser) throw new Error('Debes estar registrado para guardar favoritos');
    const userId = auth.currentUser.uid;
    const favoriteId = `${userId}_${placeId}`;
    const path = `favorites/${favoriteId}`;
    
    try {
      let favDoc;
      try {
        favDoc = await getDoc(doc(db, 'favorites', favoriteId));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        throw err;
      }

      const batch = writeBatch(db);
      const placeRef = doc(db, 'places', placeId);

      if (favDoc.exists()) {
        batch.delete(doc(db, 'favorites', favoriteId));
        batch.update(placeRef, {
          favorites_count: increment(-1)
        });
        try {
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
          throw err;
        }
        return false;
      } else {
        batch.set(doc(db, 'favorites', favoriteId), {
          user_id: userId,
          place_id: placeId,
          created_at: serverTimestamp()
        });
        batch.update(placeRef, {
          favorites_count: increment(1)
        });
        try {
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
          throw err;
        }
        return true;
      }
    } catch (err) {
      // Error already handled or generic error
      throw err;
    }
  },

  async toggleLike(placeId: string, menuItemId: string): Promise<boolean> {
    if (!auth.currentUser) throw new Error('Debes estar registrado para dar like');
    const userId = auth.currentUser.uid;
    const likeId = `${userId}_${placeId}_${menuItemId}`;
    const path = `likes/${likeId}`;
    
    try {
      let likeDoc;
      try {
        likeDoc = await getDoc(doc(db, 'likes', likeId));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        throw err;
      }

      if (likeDoc.exists()) {
        try {
          await deleteDoc(doc(db, 'likes', likeId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
          throw err;
        }
        return false;
      } else {
        try {
          await setDoc(doc(db, 'likes', likeId), {
            user_id: userId,
            place_id: placeId,
            menu_item_id: menuItemId,
            created_at: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
          throw err;
        }
        return true;
      }
    } catch (err) {
      // Error already handled or generic error
      throw err;
    }
  },

  async getMyLikes(): Promise<{ place_id: string, menu_item_id: string }[]> {
    if (!auth.currentUser) return [];
    const path = 'likes';
    try {
      const q = query(collection(db, path), where('user_id', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ place_id: doc.data().place_id, menu_item_id: doc.data().menu_item_id }));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  subscribeToLikes(userId: string, callback: (likes: string[]) => void): () => void {
    const path = 'likes';
    const q = query(collection(db, path), where('user_id', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const likes = snapshot.docs.map(doc => `${doc.data().place_id}_${doc.data().menu_item_id}`);
      callback(likes);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  subscribeToPlace(id: string, callback: (place: Place) => void): () => void {
    const path = `places/${id}`;
    return onSnapshot(doc(db, 'places', id), (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as Place);
      }
    }, (err) => {
      // Don't throw here to avoid breaking the UI, just log
      console.error('Firestore Subscription Error (Place):', err);
    });
  },

  subscribeToFavorites(userId: string, callback: (placeIds: string[]) => void): () => void {
    const path = 'favorites';
    const q = query(collection(db, path), where('user_id', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const placeIds = snapshot.docs.map(doc => doc.data().place_id);
      callback(placeIds);
    }, (err) => {
      console.error('Firestore Subscription Error (Favorites):', err);
    });
  },

  async getMyFavorites(): Promise<Place[]> {
    if (!auth.currentUser) return [];
    const path = 'favorites';
    try {
      const q = query(collection(db, path), where('user_id', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const placeIds = snapshot.docs.map(doc => doc.data().place_id);
      
      if (placeIds.length === 0) return [];
      
      // Fetch places in chunks of 10 (Firestore limit for 'in' query)
      const places: Place[] = [];
      for (let i = 0; i < placeIds.length; i += 10) {
        const chunk = placeIds.slice(i, i + 10);
        const pq = query(collection(db, 'places'), where('__name__', 'in', chunk));
        const psnap = await getDocs(pq);
        places.push(...psnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place)));
      }
      return places;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  async getPlacesByIds(ids: string[]): Promise<Place[]> {
    if (ids.length === 0) return [];
    const path = 'places';
    try {
      const places: Place[] = [];
      for (let i = 0; i < ids.length; i += 10) {
        const chunk = ids.slice(i, i + 10);
        const q = query(collection(db, path), where('__name__', 'in', chunk));
        const snapshot = await getDocs(q);
        places.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place)));
      }
      // Sort by original order of IDs to maintain history order
      return places.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  // Communes
  subscribeToCommunes(callback: (communes: Commune[]) => void): () => void {
    const path = 'communes';
    const q = query(collection(db, path), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const communes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commune));
      callback(communes);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  async createCommune(data: Partial<Commune>): Promise<any> {
    const path = 'communes';
    try {
      const docRef = await addDoc(collection(db, path), data);
      return { id: docRef.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateCommune(id: string, data: Partial<Commune>): Promise<any> {
    const path = `communes/${id}`;
    try {
      const { id: _, ...rest } = data;
      await updateDoc(doc(db, 'communes', id), rest);
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteCommune(id: string): Promise<any> {
    const path = `communes/${id}`;
    try {
      await deleteDoc(doc(db, 'communes', id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Instagram
  async getInstagramMedia(userId: string, accessToken: string, limitCount: number = 1): Promise<any[]> {
    // Use the proxy endpoint with query parameters to avoid header stripping issues
    const url = `/api/p-media?limit=${limitCount}&userId=${encodeURIComponent(userId)}&accessToken=${encodeURIComponent(accessToken)}`;
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          // Not JSON or other error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.data || [];
    } catch (err: any) {
      console.error('Instagram API Error:', err.message || err, 'URL:', url);
      throw err;
    }
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const path = 'notifications';
    try {
      const q = query(collection(db, path), where('is_active', '==', true), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at,
          expires_at: data.expires_at instanceof Timestamp ? data.expires_at.toDate().toISOString() : data.expires_at
        } as any;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path, false);
      return [];
    }
  },

  subscribeToNotifications(callback: (notifications: AppNotification[]) => void, onlyActive = false): () => void {
    const path = 'notifications';
    let q = query(collection(db, path), orderBy('created_at', 'desc'));
    
    if (onlyActive) {
      q = query(collection(db, path), where('is_active', '==', true), orderBy('created_at', 'desc'));
    }

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at,
          expires_at: data.expires_at instanceof Timestamp ? data.expires_at.toDate().toISOString() : data.expires_at
        } as any;
      });
      callback(notifications);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path, false);
    });
  },

  async createNotification(data: Partial<AppNotification>): Promise<any> {
    const path = 'notifications';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        created_at: serverTimestamp()
      });
      return { id: docRef.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateNotification(id: string, data: Partial<AppNotification>): Promise<void> {
    const path = `notifications/${id}`;
    try {
      const { id: _, ...rest } = data as any;
      await updateDoc(doc(db, 'notifications', id), rest);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteNotification(id: string): Promise<void> {
    const path = `notifications/${id}`;
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async deleteUser(uid: string): Promise<void> {
    try {
      if (!auth.currentUser) throw new Error('Unauthorized');
      
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/admin/delete-user/${uid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error("Error in api.deleteUser:", err);
      throw err;
    }
  },
};
