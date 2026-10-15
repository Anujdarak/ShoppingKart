import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, AlertTriangle, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [itemError, setItemError] = useState('');

  const product = item?.product;
  if (!product) return null;

  const fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

  const quantity = Number(item.quantity) || 1;
  const stock = Number(product.stock) || 0;
  const price = Number(product.price) || 0;
  const itemTotal = price * quantity;

  const isMinQuantity = quantity <= 1;
  const isMaxQuantity = quantity >= stock;

  const handleDecrease = async () => {
    if (isMinQuantity || actionLoading) return;
    setActionLoading(true);
    setItemError('');
    try {
      await updateQuantity(product._id, quantity - 1);
    } catch (err) {
      setItemError(err.response?.data?.message || 'Failed to decrease quantity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIncrease = async () => {
    if (isMaxQuantity || actionLoading) return;
    setActionLoading(true);
    setItemError('');
    try {
      await updateQuantity(product._id, quantity + 1);
    } catch (err) {
      setItemError(err.response?.data?.message || 'Failed to increase quantity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setItemError('');
    try {
      await removeFromCart(product._id);
    } catch (err) {
      setItemError(err.response?.data?.message || 'Failed to remove item');
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Product Image and Details */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative aspect-square w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
            <img
              src={imageError ? fallbackImage : product.image || fallbackImage}
              alt={product.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <Link
              to={`/products/${product._id}`}
              className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
              title={product.name}
            >
              {product.name}
            </Link>

            <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {product.category}
            </span>

            <div className="mt-1 text-sm font-semibold text-slate-600">
              ₹{price.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-slate-400">/ unit</span>
            </div>

            {stock <= 5 && stock > 0 && (
              <div className="text-xs font-semibold text-amber-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" />
                Only {stock} available in stock
              </div>
            )}
          </div>
        </div>

        {/* Quantity Controls, Total Price & Remove Button */}
        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {/* Quantity Controls [-] Qty [+] */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-inner">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={isMinQuantity || actionLoading}
              aria-label="Decrease quantity"
              className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="w-10 text-center text-sm font-bold text-slate-800">
              {actionLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-indigo-600" />
              ) : (
                quantity
              )}
            </div>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={isMaxQuantity || actionLoading}
              aria-label="Increase quantity"
              title={isMaxQuantity ? 'Max available stock reached' : 'Increase quantity'}
              className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Item Subtotal */}
          <div className="text-right min-w-[90px]">
            <div className="text-xs text-slate-400 font-medium">Item Total</div>
            <div className="text-lg font-extrabold text-slate-900 tracking-tight">
              ₹{itemTotal.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={actionLoading}
            aria-label="Remove item"
            title="Remove from Cart"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {itemError && (
        <div className="mt-3 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium">
          {itemError}
        </div>
      )}
    </div>
  );
}
