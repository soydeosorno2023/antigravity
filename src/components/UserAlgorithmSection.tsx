import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ThumbsUp, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLikes } from '../context/LikesContext';

export function UserAlgorithmSection() {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { likes, loading } = useLikes();

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Descubre contenido para ti</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Inicia sesión para ver recomendaciones personalizadas, tus favoritos y tus me gusta.</p>
        <Link to="/login" className="inline-block bg-sky-500 text-white px-8 py-3 rounded-full font-bold hover:bg-sky-600 transition-colors">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-black text-gray-900 dark:text-white">Para ti</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Algoritmo / Recomendaciones */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Recomendaciones</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Basado en tus intereses recientes.</p>
        </div>

        {/* Favoritos */}
        <Link to="/perfil" className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-red-200 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Favoritos</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{favorites.length} lugares guardados</p>
        </Link>

        {/* Likes */}
        <Link to="/perfil" className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-rose-200 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-500">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Mis Likes</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{likes.length} ítems marcados</p>
        </Link>
      </div>
    </div>
  );
}
