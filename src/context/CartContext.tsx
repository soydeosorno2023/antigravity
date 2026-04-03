import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, MenuSize, MenuAddon } from '../types';

interface CartItem {
  id: string; // Unique ID for the cart item (item.id + size + addons)
  menuItem: MenuItem;
  selectedSize?: MenuSize;
  selectedAddons: MenuAddon[];
  quantity: number;
  placeId: string;
  placeName: string;
  whatsapp: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, placeId: string, placeName: string, whatsapp: string, size?: MenuSize, addons?: MenuAddon[]) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (menuItem: MenuItem, placeId: string, placeName: string, whatsapp: string, size?: MenuSize, addons: MenuAddon[] = []) => {
    // If adding from a different place, we might want to clear the cart or warn the user.
    // For now, let's allow multiple places but usually a cart is per-place for WhatsApp orders.
    // Let's check if the cart has items from another place.
    if (cart.length > 0 && cart[0].placeId !== placeId) {
      if (!window.confirm('Tu carrito tiene productos de otro local. ¿Deseas vaciarlo para agregar este producto?')) {
        return;
      }
      setCart([]);
    }

    const cartItemId = `${menuItem.id}-${size?.name || 'default'}-${addons.map(a => a.name).sort().join(',')}`;

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        id: cartItemId,
        menuItem,
        selectedSize: size,
        selectedAddons: addons,
        quantity: 1,
        placeId,
        placeName,
        whatsapp
      }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const getTotal = () => {
    return cart.reduce((sum, item) => {
      const basePrice = item.selectedSize ? item.selectedSize.price : item.menuItem.price;
      const addonsPrice = item.selectedAddons.reduce((aSum, addon) => aSum + addon.price, 0);
      return sum + (basePrice + addonsPrice) * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      getTotal,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
