import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getCart, addToCart as apiAddToCart, updateCartQuantity as apiUpdateQuantity, removeFromCart as apiRemoveFromCart } from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children, user }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart from backend
  const refreshCart = useCallback(async () => {
    // If no user is logged in, clear cart
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getCart();
      if (data && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      // 401 means not authenticated, so empty cart
      if (err.response?.status === 401) {
        setCartItems([]);
      } else {
        setError(err.response?.data?.message || 'Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load cart when user logs in or changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add product to cart
  const addToCart = useCallback(async (productId) => {
    try {
      setError(null);
      const data = await apiAddToCart(productId);
      if (data && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      }
      return { success: true, message: data?.message || 'Added to cart' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to add product to cart';
      setError(errMsg);
      throw err;
    }
  }, []);

  // Update item quantity in cart
  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      setError(null);
      const data = await apiUpdateQuantity(productId, quantity);
      if (data && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      }
      return { success: true, message: data?.message || 'Cart updated' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update quantity';
      setError(errMsg);
      throw err;
    }
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    try {
      setError(null);
      const data = await apiRemoveFromCart(productId);
      if (data && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      }
      return { success: true, message: data?.message || 'Removed from cart' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to remove product from cart';
      setError(errMsg);
      throw err;
    }
  }, []);

  // Derived calculation: total units in cart (e.g. Keyboard x 2 + Mouse x 1 = 3)
  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  // Derived calculation: Subtotal = sum(product.price * quantity)
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = Number(item.product?.price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);
  }, [cartItems]);

  // Helper: check quantity of a specific product in cart
  const getItemQuantity = useCallback((productId) => {
    if (!productId) return 0;
    const cleanId = productId.toString();
    const item = cartItems.find((i) => {
      const pId = i.product?._id ? i.product._id.toString() : i.product?.toString();
      return pId === cleanId;
    });
    return item ? item.quantity : 0;
  }, [cartItems]);

  // Task 5: Clear cart after successful order verification
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const value = {
    cartItems,
    loading,
    error,
    subtotal,
    totalItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart,
    getItemQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
