import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2, AlertCircle, ShoppingBag, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { getWishlist } from '../services/api';
import WishlistCard from '../components/WishlistCard';

export default function Wishlist({ user }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWishlistData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getWishlist();
      if (data && Array.isArray(data.wishlist)) {
        setWishlist(data.wishlist);
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view your wishlist.');
      } else {
        setError("We couldn't load your wishlist.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlistData();

    // Listen for wishlist updates triggered anywhere in the app
    const handleUpdate = () => {
      fetchWishlistData();
    };

    window.addEventListener('wishlist-updated', handleUpdate);
    return () => {
      window.removeEventListener('wishlist-updated', handleUpdate);
    };
  }, [fetchWishlistData]);

  // Instant local removal handler for smooth UX without page reload
  const handleItemRemoved = (productId) => {
    setWishlist((prevList) => prevList.filter((item) => item._id !== productId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 mb-2">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Saved Products</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            My Wishlist
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            Keep track of items you love and buy them when you're ready.
          </p>
        </div>

        {!loading && !error && wishlist.length > 0 && (
          <div className="text-sm font-semibold text-slate-500">
            <span className="text-rose-600 font-bold">{wishlist.length}</span>{' '}
            {wishlist.length === 1 ? 'product saved' : 'products saved'}
          </div>
        )}
      </div>

      {/* Main Content: Loading, Error, Empty, and Populated States */}
      <div>
        {/* 1. LOADING STATE (Task 7, Section 10) */}
        {loading && (
          <div className="min-h-[380px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Loading your wishlist...</h3>
            <p className="text-xs text-slate-400 mt-1">Retrieving your saved items from ShopKart</p>
          </div>
        )}

        {/* 2. ERROR STATE (Task 7, Section 11) */}
        {!loading && error && (
          <div className="min-h-[380px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-rose-100 shadow-xs text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-4 shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Something went wrong.</h3>
            <p className="text-sm text-slate-500 mt-1">{error}</p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={fetchWishlistData}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span>Browse Products</span>
              </Link>
            </div>
          </div>
        )}

        {/* 3. EMPTY WISHLIST STATE (Task 7, Section 9) */}
        {!loading && !error && wishlist.length === 0 && (
          <div className="min-h-[420px] flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-5 shadow-inner">
              <Heart className="w-10 h-10 fill-rose-100 text-rose-500 stroke-[1.8]" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Your wishlist is empty ❤️
            </h2>
            <p className="text-base text-slate-500 mt-2 max-w-md">
              Save products you love and find them here later. Click the heart icon on any product to add it to your wishlist.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* 4. POPULATED WISHLIST GRID (Task 6) */}
        {!loading && !error && wishlist.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <WishlistCard
                key={product._id}
                product={product}
                onRemove={handleItemRemoved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
