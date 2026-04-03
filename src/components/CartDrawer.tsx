import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, X, Plus, Minus, Trash2, Send, ChevronRight, ShoppingBag, User, MapPin, Phone, LogIn, Loader2, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJsApiLoader } from '@react-google-maps/api';
import { ElegantImage } from './ElegantImage';
import { optimizeImageUrl } from '../utils/image';

const libraries: ("places")[] = ["places"];

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { cart, removeFromCart, updateQuantity, getTotal, getItemCount, clearCart } = useCart();
  const { user, loginWithGoogle, isLoggingIn } = useAuth();
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isKeyValid = apiKey && apiKey.startsWith('AIza') && apiKey.length > 20;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: isKeyValid ? apiKey : '',
    version: 'weekly',
    libraries
  });

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    lat: null as number | null,
    lng: null as number | null
  });

  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');

  const [addressSearch, setAddressSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (user && isCheckingOut) {
      setFormData({
        name: user.full_name || '',
        address: user.address || '',
        phone: user.phone || '',
        lat: null,
        lng: null
      });
      setAddressSearch(user.address || '');
    }
  }, [user, isCheckingOut]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          if (isLoaded && typeof google !== 'undefined') {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
            if (result.results && result.results.length > 0) {
              const bestResult = result.results[0];
              setFormData({
                ...formData,
                address: bestResult.formatted_address,
                lat: latitude,
                lng: longitude
              });
              setAddressSearch(bestResult.formatted_address);
            }
          } else {
            // Fallback to Nominatim if Google is not loaded
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            setFormData({
              ...formData,
              address: data.display_name,
              lat: latitude,
              lng: longitude
            });
            setAddressSearch(data.display_name);
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          const { latitude, longitude } = position.coords;
          setFormData({ ...formData, lat: latitude, lng: longitude });
          setAddressSearch("Ubicación actual (coordenadas)");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("No pudimos obtener tu ubicación. Por favor escríbela manualmente.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleAddressSearch = async (query: string) => {
    setAddressSearch(query);
    setFormData(prev => ({ ...prev, address: query }));
    
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      const fallbackToNominatim = async () => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query + ', Osorno, Chile')}&limit=5`);
          const data = await response.json();
          setSuggestions(data.map((item: any) => ({
            ...item,
            is_google: false
          })));
        } catch (err) {
          console.error("Fallback search error:", err);
        } finally {
          setIsSearching(false);
        }
      };

      try {
        if (isLoaded && typeof google !== 'undefined') {
          // Try new AutocompleteSuggestion API first (v3.54+)
          if (google.maps.places && (google.maps.places as any).AutocompleteSuggestion) {
            try {
              const { suggestions } = await (google.maps.places as any).AutocompleteSuggestion.fetchAutocompletePredictions({
                input: query,
                componentRestrictions: { country: 'cl' },
                locationBias: { radius: 10000, center: { lat: -40.5739, lng: -73.1331 } }
              });

              if (suggestions && suggestions.length > 0) {
                setSuggestions(suggestions.map((s: any) => ({
                  display_name: s.placePrediction.text.text,
                  place_id: s.placePrediction.placeId,
                  is_google: true
                })));
                setIsSearching(false);
                return;
              }
            } catch (err) {
              console.warn("New AutocompleteSuggestion API failed, falling back to old service", err);
            }
          }

          // Fallback to old AutocompleteService
          const service = new google.maps.places.AutocompleteService();
          const request = {
            input: query,
            componentRestrictions: { country: 'cl' },
            locationBias: { radius: 10000, center: { lat: -40.5739, lng: -73.1331 } }
          };
          
          service.getPlacePredictions(request, (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions.map(p => ({
                display_name: p.description,
                place_id: p.place_id,
                is_google: true
              })));
              setIsSearching(false);
            } else {
              // If Google fails (e.g. REQUEST_DENIED), use fallback
              console.warn("Google Places failed with status:", status, ". Falling back to Nominatim.");
              fallbackToNominatim();
            }
          });
        } else {
          fallbackToNominatim();
        }
      } catch (error) {
        console.error("Error searching address:", error);
        fallbackToNominatim();
      }
    }, 500);
  };

  const selectAddress = async (suggestion: any) => {
    if (suggestion.is_google && isLoaded && typeof google !== 'undefined') {
      try {
        // Try new Place API first (v3.54+)
        if (google.maps.places && (google.maps.places as any).Place) {
          try {
            const place = new (google.maps.places as any).Place({ id: suggestion.place_id });
            await place.fetchFields({ fields: ['formattedAddress', 'location'] });
            
            if (place.formattedAddress && place.location) {
              setFormData({
                ...formData,
                address: place.formattedAddress,
                lat: place.location.lat(),
                lng: place.location.lng()
              });
              setAddressSearch(place.formattedAddress);
              setSuggestions([]);
              return;
            }
          } catch (err) {
            console.warn("New Place API failed, falling back to old service", err);
          }
        }

        // Fallback to old PlacesService
        const dummyElement = document.createElement('div');
        const service = new google.maps.places.PlacesService(dummyElement);
        
        service.getDetails({
          placeId: suggestion.place_id,
          fields: ['formatted_address', 'geometry', 'address_components']
        }, async (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
            setFormData({
              ...formData,
              address: place.formatted_address || suggestion.display_name,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
            setAddressSearch(place.formatted_address || suggestion.display_name);
          } else {
            console.warn("PlacesService failed or returned denied:", status);
            if (status === 'REQUEST_DENIED') {
              alert("Error de configuración: La 'Geocoding API' o 'Places API' no están habilitadas en tu consola de Google Cloud.");
            }
            // Fallback to Nominatim coordinates search
            handleFallbackCoordinates(suggestion.display_name);
          }
        });
      } catch (error) {
        console.error("Error in selectAddress Google flow:", error);
        handleFallbackCoordinates(suggestion.display_name);
      }
    } else {
      setFormData({
        ...formData,
        address: suggestion.display_name,
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon)
      });
      setAddressSearch(suggestion.display_name);
    }
    setSuggestions([]);
  };

  const handleFallbackCoordinates = async (address: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setFormData({
          ...formData,
          address: address,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
      } else {
        setFormData({ ...formData, address: address });
      }
      setAddressSearch(address);
    } catch (fallbackErr) {
      setFormData({ ...formData, address: address });
      setAddressSearch(address);
    }
  };

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;
    if (!formData.name || (orderType === 'delivery' && !formData.address) || !formData.phone) {
      alert('Por favor completa todos los datos para el envío.');
      return;
    }

    const placeName = cart[0].placeName;
    const whatsapp = cart[0].whatsapp;
    const total = getTotal();
    
    let message = `*Nuevo Pedido - ${placeName}*\n\n`;
    
    message += `*Tipo de Pedido:* ${orderType === 'delivery' ? '🛵 Delivery' : '🛍️ Recoger en Local'}\n\n`;
    
    message += `*Datos del Cliente:*\n`;
    message += `• Nombre: ${formData.name}\n`;
    if (orderType === 'delivery') {
      message += `• Dirección: ${formData.address}\n`;
      if (formData.lat && formData.lng) {
        message += `• Ubicación: https://www.google.com/maps?q=${formData.lat},${formData.lng}\n`;
      }
    }
    message += `• Teléfono: ${formData.phone}\n\n`;
    
    message += `*Productos:*\n`;
    cart.forEach(item => {
      message += `• *${item.quantity}x ${item.menuItem.name}*\n`;
      if (item.selectedSize) {
        message += `  _Tamaño: ${item.selectedSize.name}_\n`;
      }
      if (item.selectedAddons.length > 0) {
        message += `  _Extras: ${item.selectedAddons.map(a => a.name).join(', ')}_\n`;
      }
      const itemPrice = (item.selectedSize ? item.selectedSize.price : item.menuItem.price) + 
                        item.selectedAddons.reduce((sum, a) => sum + a.price, 0);
      message += `  _Subtotal: $${(itemPrice * item.quantity).toLocaleString('es-CL')}_\n\n`;
    });

    message += `*Total: $${total.toLocaleString('es-CL')}*\n\n`;
    message += `_Pedido realizado desde Mira Osorno_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = whatsapp 
      ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
      
    window.open(whatsappUrl, '_blank');
    clearCart();
    setIsOpen(false);
    setIsCheckingOut(false);
  };

  if (getItemCount() === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating Cart Button */}
      {!isOpen && getItemCount() > 0 && (
        <motion.button
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-sky-500 text-white rounded-full shadow-2xl shadow-sky-500/40 flex items-center justify-center group"
        >
          <div className="relative">
            <ShoppingBag className="w-7 h-7" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-sky-500">
              {getItemCount()}
            </span>
          </div>
        </motion.button>
      )}

      {/* Cart Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                setIsCheckingOut(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-950 h-full shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center">
                    {isCheckingOut ? <User className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                      {isCheckingOut ? 'Datos de Entrega' : 'Tu Pedido'}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                      {cart.length > 0 ? cart[0].placeName : 'Carrito vacío'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    setIsCheckingOut(false);
                  }}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-grow overflow-y-auto p-6">
                {!isCheckingOut ? (
                  /* Items List */
                  <div className="space-y-6">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-20">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                          <ShoppingBag className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-bold">Tu carrito está vacío</p>
                        <button 
                          onClick={() => setIsOpen(false)}
                          className="mt-4 text-sky-500 font-bold text-sm hover:underline"
                        >
                          Explorar el menú
                        </button>
                      </div>
                    ) : (
                      cart.map((item) => {
                        const itemPrice = (item.selectedSize ? item.selectedSize.price : item.menuItem.price) + 
                                          item.selectedAddons.reduce((sum, a) => sum + a.price, 0);
                        
                        return (
                          <div key={item.id} className="flex gap-4 group">
                            {item.menuItem.image_url && (
                              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                <ElegantImage 
                                  src={optimizeImageUrl(item.menuItem.image_url, 160)} 
                                  alt={item.menuItem.name} 
                                  className="w-full h-full object-cover"
                                  containerClassName="w-full h-full"
                                  sizes="80px"
                                />
                              </div>
                            )}
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-900 dark:text-white truncate pr-2">
                                  {item.menuItem.name}
                                </h4>
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {(item.selectedSize || item.selectedAddons.length > 0) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.selectedSize && (
                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">
                                      {item.selectedSize.name}
                                    </span>
                                  )}
                                  {item.selectedAddons.map(addon => (
                                    <span key={addon.name} className="text-[10px] bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full font-bold">
                                      +{addon.name}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                  <button 
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-sky-500 transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-sm font-black text-gray-900 dark:text-white min-w-[20px] text-center">
                                    {item.quantity}
                                  </span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-sky-500 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="font-black text-sky-600 dark:text-sky-400">
                                  ${(itemPrice * item.quantity).toLocaleString('es-CL')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* Checkout Form */
                  <div className="space-y-6">
                    {/* Order Type Selector */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                      <button
                        onClick={() => setOrderType('delivery')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          orderType === 'delivery' 
                            ? 'bg-white dark:bg-gray-700 text-sky-500 shadow-sm' 
                            : 'text-gray-500'
                        }`}
                      >
                        <LocateFixed className="w-4 h-4" />
                        Delivery
                      </button>
                      <button
                        onClick={() => setOrderType('pickup')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          orderType === 'pickup' 
                            ? 'bg-white dark:bg-gray-700 text-sky-500 shadow-sm' 
                            : 'text-gray-500'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Recoger
                      </button>
                    </div>

                    {!user && (
                      <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-800">
                        <p className="text-sm text-sky-800 dark:text-sky-200 font-medium mb-3">
                          Inicia sesión para usar tus datos guardados automáticamente.
                        </p>
                        <button
                          onClick={async () => {
                            if (isLoggingIn) return;
                            try {
                              await loginWithGoogle();
                            } catch (err) {
                              console.error("Login error from cart drawer:", err);
                            }
                          }}
                          disabled={isLoggingIn}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
                        >
                          {isLoggingIn ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                          ) : (
                            <ElegantImage 
                              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                              className="w-5 h-5" 
                              alt="Google"
                              sizes="20px"
                            />
                          )}
                          {isLoggingIn ? 'Iniciando...' : 'Continuar con Google'}
                        </button>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                          Nombre Completo
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Juan Pérez"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                          />
                        </div>
                      </div>

                      {orderType === 'delivery' && (
                        <div>
                          <div className="flex items-center justify-between mb-2 ml-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                              Dirección de Entrega
                            </label>
                            <button
                              onClick={getCurrentLocation}
                              disabled={isLocating}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-sky-500 hover:text-sky-600 transition-colors uppercase tracking-wider"
                            >
                              {isLocating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <LocateFixed className="w-3 h-3" />
                              )}
                              Usar mi ubicación
                            </button>
                          </div>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={addressSearch}
                              onChange={(e) => handleAddressSearch(e.target.value)}
                              placeholder="Ej: Calle Falsa 123, Osorno"
                              className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                            />
                            {isSearching && (
                              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-500 animate-spin" />
                            )}
                          </div>

                          {!isKeyValid && (
                            <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                              ⚠️ El buscador de Google requiere una API Key válida. Usando buscador alternativo.
                            </p>
                          )}
                          
                          {/* Address Suggestions */}
                          <AnimatePresence>
                            {(suggestions.length > 0 || (addressSearch.length >= 3 && !isSearching)) && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-20 relative"
                              >
                                {suggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    onClick={() => selectAddress(suggestion)}
                                    className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 flex items-start gap-3"
                                  >
                                    <MapPin className="w-4 h-4 text-sky-500 mt-1 flex-shrink-0" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium line-clamp-2">
                                      {suggestion.display_name}
                                    </span>
                                  </button>
                                ))}

                                {isLoaded && isKeyValid && suggestions.some(s => s.is_google) && (
                                  <div className="p-2 flex justify-end bg-gray-50 dark:bg-gray-800/50">
                                    <ElegantImage 
                                      src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png" 
                                      alt="Powered by Google"
                                      className="h-4 dark:invert opacity-70"
                                      sizes="80px"
                                    />
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                          Teléfono de Contacto
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Ej: +56 9 1234 5678"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsCheckingOut(false)}
                      className="w-full py-2 text-sky-500 font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Volver al carrito
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Total del pedido</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      ${getTotal().toLocaleString('es-CL')}
                    </span>
                  </div>
                  
                  <button
                    onClick={isCheckingOut ? handleWhatsAppOrder : () => setIsCheckingOut(true)}
                    className={`w-full py-4 ${isCheckingOut ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-sky-500 hover:bg-sky-600'} text-white rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3`}
                  >
                    {isCheckingOut ? (
                      <>
                        <Send className="w-5 h-5" />
                        Confirmar y Pedir
                      </>
                    ) : (
                      <>
                        <span>Continuar</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  
                  {!isCheckingOut && (
                    <button
                      onClick={clearCart}
                      className="w-full mt-4 py-2 text-gray-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                      Vaciar carrito
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
