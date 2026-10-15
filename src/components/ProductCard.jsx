import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Tag, AlertTriangle, CheckCircle2, Heart, Loader2, ShoppingCart } from 'lucide-react';
import { addToWishlist, removeFromWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, isWishlistedInitially = false }) {
  const { addToCart, getItemQuantity } = useCart();
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitially);
  const [isSavingWishlist, setIsSavingWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cartSuccessNotice, setCartSuccessNotice] = useState('');

  const fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

  const inCartQuantity = getItemQuantity(product._id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isMaxStockInCart = inCartQuantity >= product.stock;

  // Keep wishlist state in sync with parent
  useEffect(() => {
    setIsWishlisted(isWishlistedInitially);
  }, [isWishlistedInitially]);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSavingWishlist) return;

    setIsSavingWishlist(true);
    setErrorMessage('');

    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
        setIsWishlisted(false);
      } else {
        try {
          await addToWishlist(product._id);
        } catch (err) {
          if (err.response?.status !== 409) throw err;
        }
        setIsWishlisted(true);
      }
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMessage('Please login to save to wishlist');
      } else {
        setErrorMessage(err.response?.data?.message || 'Unable to update wishlist. Please try again.');
      }
    } finally {
      setIsSavingWishlist(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || isOutOfStock || isMaxStockInCart) return;

    setIsAddingToCart(true);
    setErrorMessage('');
    setCartSuccessNotice('');

    try {
      await addToCart(product._id);
      setCartSuccessNotice('Added to cart!');
      setTimeout(() => {
        setCartSuccessNotice('');
      }, 2500);
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMessage('Please login to add items to cart');
      } else {
        setErrorMessage(err.response?.data?.message || 'Could not add to cart');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden">
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

        {/* Top-Right Heart Icon Overlay Button (Wishlist Toggle) */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={isSavingWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isWishlisted ? 'In Wishlist (Click to remove)' : 'Add to Wishlist'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md ${
            isWishlisted
              ? 'bg-rose-500 text-white scale-105'
              : 'bg-white/90 text-slate-600 hover:text-rose-600 hover:bg-white hover:scale-110'
          } ${isSavingWishlist ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isSavingWishlist ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          ) : (
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          )}
        </button>

        {/* Stock Badge Overlay */}
        <div className="absolute bottom-3 left-3">
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

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors"
              title={product.name}
            >
              {product.name}
            </h3>
          </div>

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
                  {product.stock} in stock
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: View Details & Add to Cart (Task 7) */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/products/${product._id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Details</span>
            </Link>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart || isOutOfStock || isMaxStockInCart}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:cursor-not-allowed ${
                isOutOfStock || isMaxStockInCart
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-100'
              }`}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : isOutOfStock ? (
                <span>Sold Out</span>
              ) : isMaxStockInCart ? (
                <span>Max In Cart</span>
              ) : inCartQuantity > 0 ? (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add ({inCartQuantity})</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>

          {/* Cart Success Toast */}
          {cartSuccessNotice && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{cartSuccessNotice}</span>
            </div>
          )}

          {/* Failure / Error notification */}
          {errorMessage && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
