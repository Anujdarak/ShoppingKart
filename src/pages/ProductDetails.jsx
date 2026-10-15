import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingCart, Tag, ShieldCheck, Truck, RefreshCw, 
  AlertCircle, CheckCircle2, AlertTriangle, Loader2, Sparkles, Heart
} from 'lucide-react';
import { getProductById, addToWishlist, removeFromWishlist, getWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, getItemQuantity, isItemActionPending } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [cartNotice, setCartNotice] = useState('');
  const [cartError, setCartError] = useState('');
  const [wishlistState, setWishlistState] = useState('idle'); // 'idle' | 'saving' | 'added' | 'already' | 'error'
  const [wishlistNotice, setWishlistNotice] = useState('');

  const fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

  const inCartQty = getItemQuantity(id);
  const isAddingToCart = isItemActionPending(id);
  const isMaxStockReached = product ? inCartQty >= product.stock : false;

  useEffect(() => {
    let isMounted = true;

    const fetchProductAndWishlist = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getProductById(id);
        if (isMounted) {
          setProduct(data);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        if (err.response?.status === 404) {
          setError('Product not found. It may have been removed or does not exist.');
        } else if (err.response?.status === 400) {
          setError('Invalid product ID provided.');
        } else {
          setError('Something went wrong while loading the product details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      // Check if product is in current user's wishlist
      try {
        const wData = await getWishlist();
        if (isMounted && wData && Array.isArray(wData.wishlist)) {
          const isSaved = wData.wishlist.some(
            (p) => (p._id ? p._id.toString() : p.toString()) === id
          );
          if (isSaved) {
            setWishlistState('added');
          } else {
            setWishlistState('idle');
          }
        }
      } catch (wErr) {
        // User not logged in or error
      }
    };

    fetchProductAndWishlist();

    const handleWishlistUpdated = async () => {
      try {
        const wData = await getWishlist();
        if (isMounted && wData && Array.isArray(wData.wishlist)) {
          const isSaved = wData.wishlist.some(
            (p) => (p._id ? p._id.toString() : p.toString()) === id
          );
          setWishlistState(isSaved ? 'added' : 'idle');
        }
      } catch (e) {}
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (isOutOfStock || isAddingToCart || isMaxStockReached) return;
    setCartNotice('');
    setCartError('');
    try {
      await addToCart(id);
      setCartNotice(
        inCartQty > 0
          ? `Added another unit to your cart! (${inCartQty + 1} in cart)`
          : 'Product added to cart successfully!'
      );
      setTimeout(() => setCartNotice(''), 3500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to add product to cart. Please try again.';
      setCartError(msg);
      setTimeout(() => setCartError(''), 4500);
    }
  };

  const handleToggleWishlist = async () => {
    if (wishlistState === 'saving') return;
    setWishlistState('saving');
    setWishlistNotice('');

    try {
      if (wishlistState === 'added' || wishlistState === 'already') {
        await removeFromWishlist(id);
        setWishlistState('idle');
        setWishlistNotice('Product removed from your wishlist.');
      } else {
        try {
          await addToWishlist(id);
        } catch (err) {
          if (err.response?.status !== 409) throw err;
        }
        setWishlistState('added');
        setWishlistNotice('Product added to your wishlist!');
      }
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch (err) {
      if (err.response?.status === 401) {
        setWishlistState('error');
        setWishlistNotice('Please log in to manage your wishlist.');
      } else {
        setWishlistState('error');
        setWishlistNotice('Unable to update wishlist. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <p className="text-base font-semibold text-slate-700">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to View Product</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Product not found.'}</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back to Products Navigation */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Products</span>
        </Link>
        <span>/</span>
        <span className="text-slate-400 font-medium">{product.category}</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-10">
        {/* Left Column: Large Product Image */}
        <div className="flex flex-col items-center">
          <div className="relative aspect-square w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200/70 shadow-inner">
            <img
              src={imageError ? fallbackImage : product.image || fallbackImage}
              alt={product.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center"
            />

            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-md text-slate-800 shadow-sm border border-slate-200">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>{product.category}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Product Details & Purchase Action */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                  {product.category}
                </span>
                {product.createdAt && (
                  <span className="text-xs text-slate-400">
                    Listed {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-slate-400 block">
                  Price
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Stock Status */}
              <div className="text-right">
                <span className="text-xs font-semibold uppercase text-slate-400 block">
                  Availability
                </span>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                    Out of Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {product.stock} units in stock
                  </span>
                )}
              </div>
            </div>

            {/* Product Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Description
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            {/* Added Notification */}
            {cartNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cartNotice}</span>
              </div>
            )}

            {/* Cart Error Notification */}
            {cartError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{cartError}</span>
              </div>
            )}

            {/* Wishlist Notification */}
            {wishlistNotice && (
              <div
                className={`p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in ${
                  wishlistState === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                    : 'bg-indigo-50 border border-indigo-200 text-indigo-800'
                }`}
              >
                {wishlistState === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <Heart className="w-4 h-4 text-rose-500 fill-current shrink-0" />
                )}
                <span>{wishlistNotice}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart || isMaxStockReached}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-lg shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>
                      {isOutOfStock
                        ? 'Currently Unavailable'
                        : isMaxStockReached
                        ? `Max Stock In Cart (${inCartQty})`
                        : inCartQty > 0
                        ? `Add Another (${inCartQty} in cart)`
                        : 'Add to Cart'}
                    </span>
                  </>
                )}
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistState === 'saving'}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-base font-bold transition-all cursor-pointer shadow-md active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed ${
                  wishlistState === 'added' || wishlistState === 'already'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-rose-100'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {wishlistState === 'saving' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span>Saving...</span>
                  </>
                ) : wishlistState === 'added' ? (
                  <>
                    <Heart className="w-5 h-5 fill-current text-rose-500" />
                    <span>Added to Wishlist</span>
                  </>
                ) : wishlistState === 'already' ? (
                  <>
                    <Heart className="w-5 h-5 fill-current text-rose-500" />
                    <span>In Wishlist</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 text-slate-700" />
                    <span>♡ Add to Wishlist</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Free Express Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>100% Authentic</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>7-Day Return Policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
