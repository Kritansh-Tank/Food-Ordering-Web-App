'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');

  const addItem = useCallback((item, restaurant) => {
    // If adding from a different restaurant, clear cart
    if (restaurantId && restaurantId !== restaurant.id) {
      if (!window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
        return;
      }
      setItems([]);
    }

    setRestaurantId(restaurant.id);
    setRestaurantName(restaurant.name);

    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, [restaurantId]);

  const removeItem = useCallback((itemId) => {
    setItems((prev) => {
      const updated = prev
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);
      if (updated.length === 0) {
        setRestaurantId(null);
        setRestaurantName('');
      }
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName('');
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, restaurantId, restaurantName,
      addItem, removeItem, clearCart,
      total, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [], restaurantId: null, restaurantName: '',
      addItem: () => {}, removeItem: () => {}, clearCart: () => {},
      total: 0, itemCount: 0,
    };
  }
  return ctx;
};

