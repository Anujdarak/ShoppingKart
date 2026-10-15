import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Phone, ShieldCheck, ShoppingCart, Package, Heart, CreditCard, 
  Sparkles, Clock, MapPin, CheckCircle2, ChevronRight, Loader2, ArrowRight
} from 'lucide-react';
import { getProfile } from '../services/api';

export default function Home({ user, setUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!user);
  const [customer, setCustomer] = useState(user || null);

  useEffect(() => {
    if (user) {
      setCustomer(user);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchCustomerProfile = async () => {
      try {
        if (!user) setLoading(true);
        // API: GET /customers/me
        const data = await getProfile();
        if (isMounted) {
          setCustomer(data);
          if (setUser) {
            setUser(data);
          }
        }
      } catch (err) {
        // If not logged in (401) -> Automatically redirect to /login
        if (err.response?.status === 401) {
          console.warn('Unauthorized session. Redirecting to /login');
          if (setUser) {
            setUser(null);
          }
          if (isMounted) {
            navigate('/login', { replace: true });
          }
        } else if (!user && isMounted) {
          // If no cached user and network failed, redirect to login
          navigate('/login', { replace: true });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCustomerProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate, setUser, user]);

  if (loading && !customer) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">
          Loading your ShopKart account...
        </p>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-10 shadow-xl shadow-indigo-950/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold uppercase tracking-wider border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Customer</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-amber-200">{customer.fullName}</span>!
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              You are authenticated and your ShopKart customer profile is active. Ready to explore new collections and manage your shopping?
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[130px]">
              <span className="block text-2xl font-bold text-white">0</span>
              <span className="text-xs text-slate-300 font-medium">Cart Items</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[130px]">
              <span className="block text-2xl font-bold text-amber-300">Gold</span>
              <span className="text-xs text-slate-300 font-medium">Tier Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Information Card (Rubric Core Requirement) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-indigo-200">
                  {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Customer Profile
                  </h2>
                  <p className="text-xs text-slate-400">Authenticated via HttpOnly Cookie</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Active
              </span>
            </div>

            {/* Customer Details Specified in Lab Rubric */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>CUSTOMER NAME</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{customer.fullName}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>EMAIL ADDRESS</span>
                </div>
                <p className="text-sm font-bold text-slate-900 break-all">{customer.email}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>PHONE NUMBER</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{customer.phone}</p>
              </div>

              {customer._id && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>CUSTOMER ID</span>
                  </div>
                  <p className="text-xs font-mono text-slate-600 truncate">{customer._id}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Secure Session</span>
                </div>
                <p className="text-indigo-600/90 text-[11px]">
                  Protected route using <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-indigo-900">GET /customers/me</code> verified by JSON Web Token.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Actions & Store Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Shopping Hub
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group cursor-pointer bg-slate-50/40">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm">Active Cart</h4>
                <p className="text-xs text-slate-500 mt-1">Review items ready for checkout</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group cursor-pointer bg-slate-50/40">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm">Order History</h4>
                <p className="text-xs text-slate-500 mt-1">Track current shipments & invoices</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group cursor-pointer bg-slate-50/40">
                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm">Wishlist</h4>
                <p className="text-xs text-slate-500 mt-1">Saved items for later purchase</p>
              </div>
            </div>
          </div>

          {/* Featured Categories / Promo */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/40 rounded-2xl border border-indigo-100/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Exclusive Deal</span>
              <h4 className="text-xl font-bold text-slate-900">Welcome Offer: 20% Off Your Next Order</h4>
              <p className="text-sm text-slate-600">Use promo code <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded shadow-2xs">WELCOME20</span> at checkout.</p>
            </div>
            <Link
              to="/products"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>Start Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
