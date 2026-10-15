import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, ShoppingBag, Calendar, Eye, AlertCircle, Loader2, 
  RotateCcw, Sparkles, CheckCircle2, Truck, Clock 
} from 'lucide-react';
import { getMyOrders, updateOrderStatus } from '../services/api';

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyOrders();
      if (data && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Something went wrong while loading your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Bonus (+10 Marks): Update order status progression
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONFIRMED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SHIPPED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Order History</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, view snapshots, and manage all your past ShopKart purchases.
          </p>
        </div>

        {!loading && !error && (
          <div className="text-sm font-semibold text-slate-500">
            Total Orders: <span className="font-bold text-slate-900">{orders.length}</span>
          </div>
        )}
      </div>

      {/* 1. LOADING STATE */}
      {loading && (
        <div className="min-h-[350px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-base font-semibold text-slate-700">Loading your orders...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving verified purchase history</p>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <div className="min-h-[350px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-rose-100 shadow-xs text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{error}</h3>
          <button
            onClick={fetchOrders}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* 3. EMPTY STATE (Task 8 Specification) */}
      {!loading && !error && orders.length === 0 && (
        <div className="min-h-[350px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">You have not placed any orders yet.</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Once you complete a purchase, your order history and receipt details will appear here.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Start Shopping</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4. ORDERS LISTING (Task 8 Layout) */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Order Card Header */}
              <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-slate-400">Order ID:</span>
                    <span className="text-sm font-bold font-mono text-slate-900">#{order._id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'Recent'}
                    </span>
                    {order.razorpayPaymentId && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          Payment ID: {order.razorpayPaymentId}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {order.status}
                  </span>

                  {/* Bonus (+10 Marks): Quick Status Progression Simulator */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                    <span>Simulate:</span>
                    <select
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer focus:outline-none"
                    >
                      <option value="PLACED">PLACED</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Items Preview (Snapshot) */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="divide-y divide-slate-100">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                          <p className="text-xs text-slate-500">
                            Qty: {item.quantity} × ₹{(item.price || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-bold text-slate-900 shrink-0">
                        ₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Details & View Button */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm">
                    <span className="text-slate-500">Total Order Amount: </span>
                    <span className="text-lg font-extrabold text-slate-900">
                      ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link
                    to={`/orders/${order._id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
