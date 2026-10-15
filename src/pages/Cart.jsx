import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight, ArrowLeft, ShieldCheck, Truck, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

export default function Cart() {
  const { cartItems, loading, error, subtotal, totalItems, refreshCart } = useCart();

  // 1. Loading State (Section 17)
  if (loading && cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="min-h-[380px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Loading your cart...</h3>
          <p className="text-xs text-slate-400 mt-1">Retrieving your saved cart from ShopKart</p>
        </div>
      </div>
    );
  }

  // 2. Error State (Section 17)
  if (error && cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="min-h-[380px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-rose-100 shadow-xs text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-4 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Unable to load your cart.</h3>
          <p className="text-sm text-slate-500 mt-1">{error}</p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={refreshCart}
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
      </div>
    );
  }

  // 3. Empty Cart State (Section 17)
  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="min-h-[420px] flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-5 shadow-inner">
            <ShoppingCart className="w-10 h-10 stroke-[1.8]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Your cart is empty 🛒
          </h2>
          <p className="text-base text-slate-500 mt-2 max-w-md">
            Looks like you haven't added anything yet. Discover our collection of high quality products and start shopping!
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 cursor-pointer"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // 4. Populated Cart State (Section 13)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Shopping Cart</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            My Cart
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            Review your items and proceed to checkout when you're ready.
          </p>
        </div>

        <div className="text-sm font-semibold text-slate-500">
          <span className="text-indigo-600 font-bold">{totalItems}</span>{' '}
          {totalItems === 1 ? 'unit' : 'units'} across{' '}
          <span className="text-slate-900 font-bold">{cartItems.length}</span>{' '}
          {cartItems.length === 1 ? 'product' : 'products'}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}

          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary Card (Section 13 & 15) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm sticky top-24 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Total Units</span>
              <span className="font-semibold text-slate-900">{totalItems}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900">Estimated Total</span>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <Link
            to="/checkout"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-lg shadow-indigo-200 transition-all cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Trust Guarantees */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Safe & Secure 256-Bit SSL Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Free Delivery on all orders across India</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
