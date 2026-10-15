import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Trash2, HeartCrack, Tag, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { removeFromWishlist } from '../services/api';

export default function WishlistCard({ product, onRemove }) {
  const [imageError, setImageError] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  const fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleRemove = async (e) => {
    e.preventDefault();
    if (removing) return;

    setRemoving(true);
    setRemoveError('');

    try {
      await removeFromWishlist(product._id);
      // Notify parent to remove immediately from state
      if (onRemove) {
        onRemove(product._id);
      }
      // Broadcast event so Navbar updates count
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setRemoveError(err.response?.data?.message || 'Failed to remove product. Please try again.');
      setRemoving(false);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-rose-200 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Container */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <img
          src={imageError ? fallbackImage : product.image || fallbackImage}
          alt={product.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Category Tag Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs border border-white/60">
            <Tag className="w-3 h-3 text-indigo-600" />
            <span>{product.category}</span>
          </span>
        </div>

        {/* Stock Badge Overlay */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-xs">
              Out of stock
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-xs">
              Only {product.stock} left
            </span>
          ) : null}
        </div>
      </div>

      {/* Details & Actions Section */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <h3
            className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Price</span>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Stock status indicator */}
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Availability</span>
              {isOutOfStock ? (
                <span className="text-xs font-semibold text-rose-600 flex items-center justify-end gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Out of stock
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {product.stock} units left
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: View Details & Remove */}
          <div className="flex flex-col gap-2 pt-1">
            <Link
              to={`/products/${product._id}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-200 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </Link>

            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/90 active:bg-rose-200 border border-rose-200/80 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {removing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Remove ♥</span>
                </>
              )}
            </button>
          </div>

          {removeError && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {removeError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
