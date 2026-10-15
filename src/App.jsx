import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import { CartProvider } from './context/CartContext';
import { getProfile } from './services/api';

export default function App() {
  // Initialize user from localStorage to prevent logout flash on page refresh
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('shopkart_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Keep localStorage in sync with user state
  useEffect(() => {
    if (user) {
      localStorage.setItem('shopkart_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('shopkart_user');
    }
  }, [user]);

  // On App mount, verify session with backend to refresh data or detect expired cookie
  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((userData) => {
        if (isMounted && userData) {
          setUser(userData);
        }
      })
      .catch((err) => {
        // If server explicitly returns 401 Unauthorized, session has expired
        if (err.response?.status === 401) {
          if (isMounted) {
            setUser(null);
            localStorage.removeItem('shopkart_user');
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <BrowserRouter>
      <CartProvider user={user}>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
          <Navbar user={user} setUser={setUser} />
          <main className="flex-1">
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/home" element={<Home user={user} setUser={setUser} />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/wishlist" element={<Wishlist user={user} />} />
              <Route path="/cart" element={<Cart user={user} />} />
              <Route path="/checkout" element={<Checkout user={user} />} />
              <Route path="/order-success/:id" element={<OrderSuccess user={user} />} />
              <Route path="/orders" element={<Orders user={user} />} />
              <Route path="/orders/:id" element={<OrderDetails user={user} />} />
              {/* Default redirect: send root to /home (Home will verify session or redirect to /login) */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}
