import React, { useState, useEffect } from 'react';
import { MenuItem, Place, MenuSize, MenuAddon } from '../types';
import { api } from '../services/api';
import { ShoppingCart, Plus, Minus, X, Check, ChevronRight, Info, ThumbsUp } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLikes } from '../context/LikesContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ElegantImage } from './ElegantImage';
import { optimizeImageUrl } from '../utils/image';

interface MenuSectionProps {
  place: Place;
  menuItems?: MenuItem[];
}

export function MenuSection({ place, menuItems: propMenuItems }: MenuSectionProps) {
  const [internalMenuItems, setInternalMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(!propMenuItems);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<MenuSize | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<MenuAddon[]>([]);
  const { addToCart, cart, getItemCount } = useCart();
  const { toggleLike, isLiked } = useLikes();

  const allItems = propMenuItems || internalMenuItems;
  const menuItems = allItems.filter(item => item.is_available !== false);

  useEffect(() => {
    if (propMenuItems) {
      setLoading(false);
      return;
    }
    const unsubscribe = api.subscribeToMenuItems(place.id, (items) => {
      setInternalMenuItems(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [place.id, propMenuItems]);

  const handleOpenModal = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] : undefined);
    setSelectedAddons([]);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleToggleAddon = (addon: MenuAddon) => {
    setSelectedAddons(prev => 
      prev.find(a => a.name === addon.name)
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    if (selectedItem) {
      addToCart(selectedItem, place.id, place.name, place.whatsapp, selectedSize, selectedAddons);
      handleCloseModal();
    }
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category || 'Otros')));

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Cargando menú...</p>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Nuestro Menú</h2>
        {getItemCount() > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-full text-sm font-bold shadow-lg shadow-sky-500/20">
            <ShoppingCart className="w-4 h-4" />
            <span>{getItemCount()} items</span>
          </div>
        )}
      </div>

      {categories.map(category => (
        <div key={category} className="mb-10">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems
              .filter(item => (item.category || 'Otros') === category)
              .map(item => (
                <motion.div 
                  key={item.id}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 flex gap-4 group cursor-pointer"
                  onClick={() => handleOpenModal(item)}
                >
                  {item.image_url && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                      <ElegantImage 
                        src={optimizeImageUrl(item.image_url, 200)} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        containerClassName="w-full h-full"
                        sizes="96px"
                      />
                    </div>
                  )}
                  <div className="flex-grow min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sky-600 dark:text-sky-400 font-black">
                        ${item.price.toLocaleString('es-CL')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(place.id, item.id);
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isLiked(place.id, item.id)
                              ? 'bg-sky-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-sky-50 hover:text-sky-500'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      ))}

      {/* Add to Cart Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white truncate">{selectedItem.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{selectedItem.description}</p>
                  </div>
                  <button 
                    onClick={handleCloseModal}
                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedItem.image_url && (
                  <div className="w-full h-48 rounded-3xl overflow-hidden mb-6">
                    <ElegantImage 
                      src={optimizeImageUrl(selectedItem.image_url, 600)} 
                      alt={selectedItem.name} 
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                      sizes="(max-width: 640px) 100vw, 512px"
                    />
                  </div>
                )}

                {/* Sizes */}
                {selectedItem.sizes && selectedItem.sizes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Tamaño</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedItem.sizes.map(size => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSize(size)}
                          className={`p-3 rounded-2xl border-2 transition-all flex justify-between items-center ${
                            selectedSize?.name === size.name
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                              : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          <span className="font-bold">{size.name}</span>
                          <span className="text-xs font-black">${size.price.toLocaleString('es-CL')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addons */}
                {selectedItem.addons && selectedItem.addons.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Extras / Agregados</h4>
                    <div className="space-y-2">
                      {selectedItem.addons.map(addon => (
                        <button
                          key={addon.name}
                          onClick={() => handleToggleAddon(addon)}
                          className={`w-full p-3 rounded-2xl border-2 transition-all flex justify-between items-center ${
                            selectedAddons.find(a => a.name === addon.name)
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                              : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                              selectedAddons.find(a => a.name === addon.name) ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              {selectedAddons.find(a => a.name === addon.name) && <Check className="w-3 h-3" />}
                            </div>
                            <span className="font-bold">{addon.name}</span>
                          </div>
                          <span className="text-xs font-black">+${addon.price.toLocaleString('es-CL')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-3"
                >
                  <Plus className="w-6 h-6" />
                  Agregar al pedido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
