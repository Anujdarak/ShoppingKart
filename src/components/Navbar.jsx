import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, LogOut, User, Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { logoutCustomer, getWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const [wishlistCount, setWishlistCount] = useState(null);

  // Bonus Task (+5 Marks): Fetch Wishlist count from backend dynamically
  useEffect(() => {
    let isMounted = true;

    const fetchWishlistCount = async () => {
      if (!user) {
        if (isMounted) setWishlistCount(null);
        return;
      }
      try {
        const data = await getWishlist();
        if (isMounted) {
          setWishlistCount(typeof data.count === 'number' ? data.count : (data.wishlist?.length || 0));
        }
      } catch (err) {
        if (isMounted) setWishlistCount(null);
      }
    };

    fetchWishlistCount();

    const handleWishlistUpdated = () => {
      fetchWishlistCount();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (setUser) {
        setUser(null);
      }
      setWishlistCount(null);
      navigate('/login');
    }
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to={user ? "/home" : "/products"} className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 bg-clip-text text-transparent">
                Shop<span className="text-indigo-600">Kart</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 -mt-1">
                E-Commerce
              </span>
            </div>
          </Link>

          {/* Navigation Links (Home | Products | Wishlist) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/products"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname.startsWith('/products')
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              Products
            </Link>

            {/* Task 8 & Bonus: Wishlist Link with dynamic backend count */}
            <Link
              to="/wishlist"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname === '/wishlist'
                  ? 'text-rose-600 bg-rose-50'
                  : 'text-slate-700 hover:text-rose-600 hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${location.pathname === '/wishlist' ? 'fill-current' : ''}`} />
              <span>
                Wishlist
                {user && wishlistCount !== null ? ` (${wishlistCount})` : ''}
              </span>
            </Link>

            {/* Lab 05: Cart Link with dynamic total items count */}
            <Link
              to="/cart"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname === '/cart'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                Cart
                {user && typeof totalItems === 'number' ? ` (${totalItems})` : ''}
              </span>
            </Link>

            {user && (
              <>
                <Link
                  to="/orders"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    location.pathname.startsWith('/orders')
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
                  }`}
                >
                  Orders
                </Link>

                <Link
                  to="/home"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    location.pathname === '/home'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* User Account / Auth Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {user.fullName ? user.fullName.charAt(0) : 'U'}
                  </div>
                  <span className="text-sm font-semibold text-indigo-900 max-w-[120px] truncate">
                    {user.fullName || user.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/70 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Logout of ShopKart"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <nav className="flex items-center gap-2">
                {location.pathname !== '/login' && (
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    Login
                  </Link>
                )}
                {location.pathname !== '/register' && (
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
                  >
                    Create Account
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
