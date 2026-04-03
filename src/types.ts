export interface User {
  id: string;
  username: string;
  role: 'admin' | 'owner' | 'user';
  full_name: string;
  email: string;
  avatar_url?: string;
  address?: string;
  phone?: string;
  last_read_notifications_at?: string;
  assigned_place_id?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image_url?: string;
  slug: string;
  order_index?: number;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  order_index?: number;
}

export interface MenuSize {
  name: string;
  price: number;
}

export interface MenuAddon {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  place_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string; // e.g., "Pizzas", "Bebidas"
  sizes?: MenuSize[];
  addons?: MenuAddon[];
  is_available: boolean;
  order_index?: number;
}

export interface Place {
  id: string;
  category_id: string;
  subcategory_id?: string;
  owner_id?: string;
  category_name?: string;
  subcategory_name?: string;
  name: string;
  slug: string;
  full_description: string;
  profile_image_url: string;
  cover_image_url: string;
  gallery: string; // JSON string
  address: string;
  lat: number;
  lng: number;
  phone: string;
  whatsapp: string;
  website: string;
  hours: string;
  youtube_video_url?: string;
  owner_username?: string;
  owner_custom_username?: string;
  owner_password?: string;
  is_featured: number | boolean;
  is_active: number | boolean;
  favorites_count?: number;
  is_pet_friendly?: boolean;
  has_parking?: boolean;
  has_wifi?: boolean;
  instagram_access_token?: string;
  instagram_user_id?: string;
  instagram_username?: string;
  instagram_token_expires_at?: string;
  has_menu?: boolean; // New field to indicate if the place has a menu feature enabled
}

export interface Tour {
  id: string;
  place_id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  image_url: string;
}

export interface Review {
  id: string;
  place_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  place_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  place_id: string;
  menu_item_id: string;
  created_at: string;
}

export interface AppSettings {
  logo_url?: string;
  hero_image_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  contact_email?: string;
}

export interface Media {
  id: string;
  url: string;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  user_id: string;
  created_at: string;
}

export interface Commune {
  id: string;
  name: string;
  lat: number;
  lng: number;
  image_url: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  image_url?: string;
  link_url?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}
