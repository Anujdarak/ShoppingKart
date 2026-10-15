import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { 
  CheckCircle2, ShoppingBag, ArrowRight, Package, MapPin, 
  Calendar, ShieldCheck, Sparkles, Loader2 
} from 'lucide-react';
import { getOrderById } from '../services/api';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order) return;

    let isMounted = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(id);
        if (isMounted && data.order) {
          setOrder(data.order);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Could not load order confirmation');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [id, order]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading order confirmation...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in">
      {/* Success Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.3]" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="w-3 h-3" />
            <span>Payment Verified</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
            Your order has been saved successfully and your payment has been verified via Razorpay.
          </p>
        </div>

        {/* Order Details Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-left">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase block">Order ID</span>
            <span className="text-sm font-bold text-slate-900 font-mono truncate block" title={order?._id || id}>
              #{order?._id || id}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase block">Total Paid</span>
            <span className="text-base font-extrabold text-indigo-600 block">
              ₹{(order?.totalAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase block">Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {order?.status || 'PLACED'}
            </span>
          </div>
        </div>

        {/* Delivery Destination */}
        {order?.shippingAddress && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Delivering to: {order.shippingAddress.fullName} ({order.shippingAddress.phone})</span>
            </div>
            <p className="text-slate-500 pl-5">
              {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>
        )}

        {/* Action Buttons (Task 6) */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-slate-100">
          <Link
            to="/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>View My Orders</span>
          </Link>

          <Link
            to="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
