import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Truck, CreditCard, AlertCircle, CheckCircle2, 
  Loader2, ShoppingBag, MapPin, User, Phone, Home, Building, Sparkles, X,
  QrCode, Timer, Lock, RefreshCw, ChevronLeft, Smartphone
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createPaymentOrder, verifyPayment } from '../services/api';

// Helper to load Razorpay Checkout Script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout({ user }) {
  const navigate = useNavigate();
  const { cartItems, subtotal, totalItems, clearCart, refreshCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);

  // Interactive Payment Modes: 'card' | 'upi'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [razorpayLoading, setRazorpayLoading] = useState(true);
  const [cardStep, setCardStep] = useState('input'); // 'input' | 'otp'
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: ''
  });
  const [cardError, setCardError] = useState('');
  const [cardOtp, setCardOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [upiTimer, setUpiTimer] = useState(300); // 5 mins
  const [upiIdInput, setUpiIdInput] = useState('');

  // Controlled card input formatters
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 19);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardData((prev) => ({ ...prev, number: formatted }));
    if (cardError) setCardError('');
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/[^\d/]/g, '').slice(0, 5);
    if (val.length === 2 && !val.includes('/') && e.nativeEvent?.inputType !== 'deleteContentBackward') {
      val = val + '/';
    }
    setCardData((prev) => ({ ...prev, expiry: val }));
    if (cardError) setCardError('');
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardData((prev) => ({ ...prev, cvv: val }));
    if (cardError) setCardError('');
  };

  const handleHolderChange = (e) => {
    setCardData((prev) => ({ ...prev, holder: e.target.value }));
    if (cardError) setCardError('');
  };

  // Validate card details strictly
  const validateCardDetails = () => {
    const rawNumber = (cardData.number || '').replace(/\D/g, '');
    const rawCvv = (cardData.cvv || '').trim();
    const rawExpiry = (cardData.expiry || '').trim();
    const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;

    if (!rawNumber || rawNumber.length < 12) {
      setCardError('Invalid card details: Card number must be at least 12 digits');
      return false;
    }

    if (!rawExpiry || !expiryRegex.test(rawExpiry)) {
      setCardError('Invalid card details: Expiry date must be in MM/YY format (e.g. 12/28)');
      return false;
    }

    if (!rawCvv || rawCvv.length < 3) {
      setCardError('Invalid card details: CVV must be at least 3 digits');
      return false;
    }

    if (!cardData.holder || !cardData.holder.trim()) {
      setCardError('Invalid card details: Please enter name on card');
      return false;
    }

    setCardError('');
    return true;
  };

  // UPI Countdown Timer Effect
  useEffect(() => {
    let interval = null;
    if (showTestModal && !razorpayLoading && paymentMethod === 'upi') {
      interval = setInterval(() => {
        setUpiTimer((prev) => (prev > 0 ? prev - 1 : 300));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showTestModal, razorpayLoading, paymentMethod]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Handle controlled input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Client-side shipping form validation (Task 3)
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required';
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must contain a valid 10-digit number';
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must contain exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Complete Payment Verification Flow (Task 4 & Razorpay)
  const handlePaymentVerification = async (verifyPayload) => {
    try {
      setIsProcessing(true);
      setStatusMessage('Verifying payment signature with backend...');
      const verifyRes = await verifyPayment(verifyPayload);

      if (verifyRes.success && verifyRes.order) {
        // Clear global cart state (Task 5)
        clearCart();
        refreshCart();

        // Navigate to Order Success page (Task 6)
        navigate(`/order-success/${verifyRes.order._id}`, {
          state: { order: verifyRes.order }
        });
      }
    } catch (err) {
      console.error('Payment verification failed:', err);
      setServerError(
        err.response?.data?.message || 'Payment signature verification failed. Your cart was preserved.'
      );
      setIsProcessing(false);
      setStatusMessage('');
      setShowTestModal(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setServerError('Your cart is empty. Please add items before placing an order.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Creating pending order and initializing Razorpay transaction...');

    try {
      // Step 1: Create pending ShopKart order & Razorpay order from backend
      const orderData = await createPaymentOrder({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      });

      setPendingOrderData(orderData);
      setIsProcessing(false);
      setStatusMessage('');
      setPaymentMethod('card');
      setCardStep('input');
      setCardData({
        number: '',
        expiry: '',
        cvv: '',
        holder: ''
      });
      setCardError('');
      setCardOtp('');
      setOtpError('');
      setUpiTimer(300);
      setRazorpayLoading(true);
      setShowTestModal(true);

      // Trigger official Razorpay logo splash popup before showing payment options
      setTimeout(() => {
        setRazorpayLoading(false);
      }, 1200);

    } catch (err) {
      console.error('Order creation error:', err);
      let errMsg = 'Failed to initialize payment order. Please try again.';
      if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.response?.status === 401) {
        errMsg = 'Your session has expired. Please log in again to checkout.';
      } else if (err.response?.status === 502 || err.code === 'ERR_NETWORK') {
        errMsg = 'Unable to connect to the backend server. Please verify the backend is running on port 3000.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setServerError(errMsg);
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  // Launch official Razorpay SDK window (if user has dashboard test keys)
  const handleLaunchOfficialRazorpay = async () => {
    if (!pendingOrderData) return;
    setIsProcessing(true);
    setStatusMessage('Loading official Razorpay Checkout...');

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      setServerError('Unable to load Razorpay script from CDN. Please use the simulated test payment.');
      setIsProcessing(false);
      setStatusMessage('');
      return;
    }

    const options = {
      key: pendingOrderData.key,
      amount: pendingOrderData.amount,
      currency: pendingOrderData.currency || 'INR',
      name: 'ShopKart',
      description: `Order #${pendingOrderData.shopKartOrderId.toString().slice(-6)}`,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
      order_id: pendingOrderData.razorpayOrderId.startsWith('order_') && !pendingOrderData.razorpayOrderId.includes('_test_')
        ? pendingOrderData.razorpayOrderId
        : undefined,

      handler: async function (response) {
        setShowTestModal(false);
        await handlePaymentVerification({
          shopKartOrderId: pendingOrderData.shopKartOrderId,
          razorpay_order_id: response.razorpay_order_id || pendingOrderData.razorpayOrderId,
          razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
          razorpay_signature: response.razorpay_signature || `valid_signature_${pendingOrderData.razorpayOrderId}`
        });
      },

      prefill: {
        name: formData.fullName,
        contact: formData.phone,
        email: user?.email || 'customer@example.com'
      },

      theme: {
        color: '#4f46e5'
      },

      modal: {
        ondismiss: function () {
          setIsProcessing(false);
          setStatusMessage('');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      console.error('Razorpay payment failed:', resp.error);
      setServerError(`Payment failed: ${resp.error?.description || 'Invalid Test Key'}. Razorpay returned an error for placeholder test credentials. Use the "Simulate Successful Payment" button below.`);
      setIsProcessing(false);
      setStatusMessage('');
    });

    rzp.open();
  };

  // If cart is empty, show empty state notice
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            There are no products in your cart to checkout. Browse our catalog and add items before placing an order.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              <span>Explore Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-fade-in">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Checkout & Payment
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter shipping destination and complete secure Razorpay Test payment.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Razorpay Test Mode
          </span>
        </div>
      </div>

      {/* Global Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="font-medium">{serverError}</div>
        </div>
      )}

      {/* Status Progress Notice */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center gap-3 text-indigo-900 text-sm animate-fade-in">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
          <div className="font-semibold">{statusMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Shipping Address Form (Task 2 & 3) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Shipping Details</h2>
              <p className="text-xs text-slate-500">Provide the delivery destination for your order</p>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="fullName">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Aarav Sharma"
                  disabled={isProcessing}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.fullName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-200'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-rose-600 font-medium">⚠️ {errors.fullName}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="phone">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  disabled={isProcessing}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-200'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-600 font-medium">⚠️ {errors.phone}</p>
              )}
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="addressLine1">
                Street Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Home className="w-4 h-4" />
                </div>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  type="text"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="e.g. Flat 402, Lotus Towers, MG Road"
                  disabled={isProcessing}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.addressLine1 ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-200'
                  }`}
                />
              </div>
              {errors.addressLine1 && (
                <p className="mt-1 text-xs text-rose-600 font-medium">⚠️ {errors.addressLine1}</p>
              )}
            </div>

            {/* City & State Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="city">
                  City <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    disabled={isProcessing}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.city ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-200'
                    }`}
                  />
                </div>
                {errors.city && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">⚠️ {errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="state">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Karnataka"
                  disabled={isProcessing}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.state ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-200'
                  }`}
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">⚠️ {errors.state}</p>
                )}
              </div>
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="pincode">
                Pincode (6 Digits) <span className="text-rose-500">*</span>
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                maxLength={6}
                value={formData.pincode}
                onChange={handleChange}
                placeholder="e.g. 560001"
                disabled={isProcessing}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.pincode ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-200'
                }`}
              />
              {errors.pincode && (
                <p className="mt-1 text-xs text-rose-600 font-medium">⚠️ {errors.pincode}</p>
              )}
            </div>

            {/* Submit Trigger inside Form */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-lg shadow-indigo-200 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Place Order & Pay ₹{subtotal.toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary (Task 2 Layout) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm sticky top-24 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Order Summary ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h2>

          {/* Cart Items Snapshot Preview */}
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 space-y-1">
            {cartItems.map((item) => (
              <div key={item.product?._id || item._id} className="py-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={item.product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {item.product?.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    ₹{(item.product?.price || 0).toLocaleString('en-IN')} × {item.quantity}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-2.5 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900">Total Payable</span>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Razorpay Verified 256-Bit SSL Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Free Express Delivery Across India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Interactive Checkout Modal (Cards + OTP & UPI + QR + Timer) */}
      {showTestModal && pendingOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-4">
            
            {/* STAGE 1: OFFICIAL RAZORPAY POPUP INITIAL SPLASH / CONNECTING SCREEN */}
            {razorpayLoading ? (
              <div className="bg-[#0c2340] text-white p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[420px] space-y-6 relative animate-fade-in">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Official Razorpay Authentic Emblem */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-white p-3.5 flex items-center justify-center shadow-2xl shadow-blue-500/20 border border-slate-100">
                      <svg viewBox="0 0 24 24" className="w-12 h-12">
                        <path
                          d="m22.436 0-11.91 7.773-1.174 4.276 6.625-4.297-4.662 16.248H6.943l4.634-16.22-6.52 4.23L6.2 7.787 18.064 0Z"
                          fill="#0C83FD"
                        />
                      </svg>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-[#0c2340] shadow-md">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Official Razorpay Wordmark Badge */}
                  <div className="flex items-center justify-center pt-1">
                    <img
                      src="https://badges.razorpay.com/badge-light.png"
                      alt="Secured by Razorpay"
                      className="h-9 object-contain filter drop-shadow"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-white">Razorpay</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold uppercase tracking-wider">
                      Standard Checkout
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Paying <span className="text-white font-semibold">ShopKart Inc.</span>
                  </p>
                  <p className="text-2xl font-black text-emerald-400 pt-1 tracking-tight">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Connecting Spinner Indicator */}
                <div className="inline-flex items-center gap-2.5 text-xs text-blue-100 bg-blue-900/40 border border-blue-700/50 px-5 py-2.5 rounded-full shadow-inner">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3395ff]" />
                  <span>Connecting to Razorpay gateway...</span>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-3">
                  <span className="flex items-center gap-1 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Official 256-Bit SSL Encryption
                  </span>
                  <span>•</span>
                  <span>PCI-DSS Certified</span>
                </div>
              </div>
            ) : (
              /* STAGE 2: RAZORPAY PAYMENT METHODS SCREEN (CARD & UPI ONLY) */
              <div>
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#0c2340] via-slate-900 to-[#072654] text-white p-5 sm:p-6 relative">
                  <button
                    type="button"
                    onClick={() => setShowTestModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center justify-between pr-8 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white p-2 flex items-center justify-center shadow-md">
                        <svg viewBox="0 0 24 24" className="w-6 h-6">
                          <path
                            d="m22.436 0-11.91 7.773-1.174 4.276 6.625-4.297-4.662 16.248H6.943l4.634-16.22-6.52 4.23L6.2 7.787 18.064 0Z"
                            fill="#0C83FD"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Razorpay</h3>
                          <span className="text-[10px] text-blue-200 px-1.5 py-0.5 rounded bg-blue-500/20 font-semibold border border-blue-400/30">
                            TEST MODE
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">Order #{pendingOrderData.razorpayOrderId.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Amount</span>
                      <span className="text-lg sm:text-xl font-extrabold text-emerald-400">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* 2 Navigation Tabs: Card and UPI Only */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/10 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => { setPaymentMethod('card'); setCardStep('input'); setCardError(''); }}
                      className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Cards (Debit / Credit)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPaymentMethod('upi'); setCardError(''); }}
                      className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>UPI / QR Code</span>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 space-y-4">

                  {/* TAB 1: CARD PAYMENT (DEBIT & CREDIT) */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-4 animate-fade-in">
                      {cardStep === 'input' ? (
                        /* Step 1: Blank Card Details with Strict Validation */
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">Enter Card Details</span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">VISA</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">Mastercard</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">RuPay</span>
                            </div>
                          </div>

                          {/* Card Error Alert */}
                          {cardError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span className="font-semibold">{cardError}</span>
                            </div>
                          )}

                          {/* Card Number */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Card Number <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={cardData.number}
                                onChange={handleCardNumberChange}
                                placeholder="1234 5678 9012 3456"
                                maxLength={23}
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wider focus:outline-none focus:ring-2 ${
                                  cardError && (!cardData.number || cardData.number.replace(/\D/g, '').length < 12)
                                    ? 'border-rose-400 focus:ring-rose-500/20'
                                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                }`}
                              />
                              <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Min. 12 digits required</p>
                          </div>

                          {/* Expiry & CVV */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Expiry Date <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={cardData.expiry}
                                onChange={handleExpiryChange}
                                placeholder="MM/YY"
                                maxLength={5}
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 ${
                                  cardError && (!cardData.expiry || !/^(0[1-9]|1[0-2])\/(\d{2})$/.test(cardData.expiry))
                                    ? 'border-rose-400 focus:ring-rose-500/20'
                                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                }`}
                              />
                              <p className="text-[10px] text-slate-400 mt-0.5">Format: MM/YY</p>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                CVV / CVC <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  value={cardData.cvv}
                                  onChange={handleCvvChange}
                                  placeholder="•••"
                                  maxLength={4}
                                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-widest focus:outline-none focus:ring-2 ${
                                    cardError && (!cardData.cvv || cardData.cvv.length < 3)
                                      ? 'border-rose-400 focus:ring-rose-500/20'
                                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                  }`}
                                />
                                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">3 digits on back</p>
                            </div>
                          </div>

                          {/* Name on Card */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Cardholder Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={cardData.holder}
                              onChange={handleHolderChange}
                              placeholder="Name as printed on card"
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                                cardError && !cardData.holder.trim()
                                  ? 'border-rose-400 focus:ring-rose-500/20'
                                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                              }`}
                            />
                          </div>

                          {/* Proceed to OTP Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!validateCardDetails()) return;
                              setCardStep('otp');
                              setCardOtp('');
                              setOtpError('');
                            }}
                            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                          >
                            <Lock className="w-4 h-4" />
                            <span>Pay ₹{subtotal.toLocaleString('en-IN')} & Request OTP</span>
                          </button>
                        </div>
                      ) : (
                        /* Step 2: Bank 3D Secure OTP Screen (User types OTP) */
                        <div className="space-y-4 animate-fade-in">
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">Bank 3D Secure Verification</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              Please enter the One Time Password (OTP) sent to your registered mobile number ending with{' '}
                              <strong className="text-slate-800 font-mono">
                                ******{formData.phone ? formData.phone.slice(-4) : '9876'}
                              </strong>
                            </p>
                            <div className="text-xs text-slate-400 font-mono">
                              Card: **** **** **** {cardData.number.replace(/\D/g, '').slice(-4)} | Amount: ₹{subtotal.toLocaleString('en-IN')}
                            </div>
                          </div>

                          {/* OTP Error Alert */}
                          {otpError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2 rounded-xl text-center font-semibold animate-fade-in">
                              {otpError}
                            </div>
                          )}

                          {/* OTP Input Field (User types OTP) */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                              Enter Bank OTP <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={cardOtp}
                              onChange={(e) => {
                                setCardOtp(e.target.value);
                                if (otpError) setOtpError('');
                              }}
                              placeholder="Enter OTP"
                              maxLength={8}
                              autoFocus
                              className="w-full py-3 px-4 rounded-xl border-2 border-indigo-500/40 text-center font-mono text-xl tracking-[0.4em] font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                            />
                            <p className="text-[11px] text-center text-slate-400 mt-1.5">
                              Please enter the OTP to confirm your payment.
                            </p>
                          </div>

                          {/* Submit OTP button */}
                          <div className="space-y-2 pt-1">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!cardOtp.trim()) {
                                  setOtpError('Please enter the OTP');
                                  return;
                                }
                                setShowTestModal(false);
                                const testPaymentId = `pay_card_${Date.now()}`;
                                await handlePaymentVerification({
                                  shopKartOrderId: pendingOrderData.shopKartOrderId,
                                  razorpay_order_id: pendingOrderData.razorpayOrderId,
                                  razorpay_payment_id: testPaymentId,
                                  razorpay_signature: `test_signature_${testPaymentId}`
                                });
                              }}
                              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Submit OTP & Complete Order</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCardStep('input');
                                setOtpError('');
                              }}
                              className="w-full py-2 px-3 text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Change Card Details</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: UPI / QR CODE PAYMENT */}
                  {paymentMethod === 'upi' && (
                    <div className="space-y-4 text-center animate-fade-in">
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                        <span>Supported UPI Apps:</span>
                        <span className="font-bold text-slate-800">GPay • PhonePe • Paytm • BHIM • Cred</span>
                      </div>

                      {/* Visual SVG QR Code with UPI badge */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 inline-block shadow-inner mx-auto">
                        <svg viewBox="0 0 200 200" className="w-44 h-44 mx-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                          {/* Corner markers */}
                          <rect x="10" y="10" width="45" height="45" rx="6" fill="#1e293b" />
                          <rect x="18" y="18" width="29" height="29" rx="3" fill="#ffffff" />
                          <rect x="24" y="24" width="17" height="17" rx="2" fill="#4f46e5" />

                          <rect x="145" y="10" width="45" height="45" rx="6" fill="#1e293b" />
                          <rect x="153" y="18" width="29" height="29" rx="3" fill="#ffffff" />
                          <rect x="159" y="24" width="17" height="17" rx="2" fill="#4f46e5" />

                          <rect x="10" y="145" width="45" height="45" rx="6" fill="#1e293b" />
                          <rect x="18" y="153" width="29" height="29" rx="3" fill="#ffffff" />
                          <rect x="24" y="159" width="17" height="17" rx="2" fill="#4f46e5" />

                          {/* QR matrix dots */}
                          <rect x="65" y="15" width="8" height="8" fill="#1e293b" />
                          <rect x="85" y="15" width="16" height="8" fill="#1e293b" />
                          <rect x="110" y="15" width="8" height="8" fill="#1e293b" />
                          <rect x="125" y="15" width="8" height="8" fill="#1e293b" />
                          <rect x="65" y="30" width="16" height="8" fill="#1e293b" />
                          <rect x="95" y="30" width="8" height="8" fill="#1e293b" />
                          <rect x="115" y="30" width="18" height="8" fill="#1e293b" />
                          <rect x="65" y="45" width="8" height="8" fill="#1e293b" />
                          <rect x="85" y="45" width="24" height="8" fill="#1e293b" />
                          <rect x="120" y="45" width="12" height="8" fill="#1e293b" />

                          <rect x="15" y="65" width="20" height="8" fill="#1e293b" />
                          <rect x="45" y="65" width="8" height="8" fill="#1e293b" />
                          <rect x="65" y="65" width="8" height="8" fill="#1e293b" />
                          <rect x="85" y="65" width="16" height="8" fill="#1e293b" />
                          <rect x="110" y="65" width="24" height="8" fill="#1e293b" />
                          <rect x="145" y="65" width="12" height="8" fill="#1e293b" />
                          <rect x="165" y="65" width="20" height="8" fill="#1e293b" />

                          <rect x="15" y="80" width="8" height="8" fill="#1e293b" />
                          <rect x="35" y="80" width="18" height="8" fill="#1e293b" />
                          <rect x="65" y="80" width="12" height="8" fill="#1e293b" />
                          <rect x="145" y="80" width="8" height="8" fill="#1e293b" />
                          <rect x="165" y="80" width="16" height="8" fill="#1e293b" />

                          {/* Center UPI Badge */}
                          <rect x="78" y="78" width="44" height="44" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                          <rect x="83" y="83" width="34" height="34" rx="6" fill="#0f172a" />
                          <text x="100" y="104" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="sans-serif">UPI</text>

                          <rect x="15" y="95" width="16" height="8" fill="#1e293b" />
                          <rect x="40" y="95" width="12" height="8" fill="#1e293b" />
                          <rect x="145" y="95" width="18" height="8" fill="#1e293b" />
                          <rect x="175" y="95" width="8" height="8" fill="#1e293b" />

                          <rect x="15" y="110" width="12" height="8" fill="#1e293b" />
                          <rect x="35" y="110" width="20" height="8" fill="#1e293b" />
                          <rect x="65" y="110" width="8" height="8" fill="#1e293b" />
                          <rect x="135" y="110" width="16" height="8" fill="#1e293b" />
                          <rect x="160" y="110" width="24" height="8" fill="#1e293b" />

                          <rect x="15" y="125" width="8" height="8" fill="#1e293b" />
                          <rect x="35" y="125" width="16" height="8" fill="#1e293b" />
                          <rect x="65" y="125" width="16" height="8" fill="#1e293b" />
                          <rect x="90" y="125" width="8" height="8" fill="#1e293b" />
                          <rect x="110" y="125" width="20" height="8" fill="#1e293b" />
                          <rect x="140" y="125" width="8" height="8" fill="#1e293b" />
                          <rect x="160" y="125" width="18" height="8" fill="#1e293b" />

                          <rect x="65" y="145" width="18" height="8" fill="#1e293b" />
                          <rect x="95" y="145" width="12" height="8" fill="#1e293b" />
                          <rect x="120" y="145" width="16" height="8" fill="#1e293b" />
                          <rect x="145" y="145" width="8" height="8" fill="#1e293b" />
                          <rect x="165" y="145" width="20" height="8" fill="#1e293b" />

                          <rect x="65" y="160" width="8" height="8" fill="#1e293b" />
                          <rect x="85" y="160" width="24" height="8" fill="#1e293b" />
                          <rect x="118" y="160" width="12" height="8" fill="#1e293b" />
                          <rect x="145" y="160" width="16" height="8" fill="#1e293b" />
                          <rect x="170" y="160" width="12" height="8" fill="#1e293b" />

                          <rect x="65" y="175" width="16" height="8" fill="#1e293b" />
                          <rect x="90" y="175" width="12" height="8" fill="#1e293b" />
                          <rect x="110" y="175" width="20" height="8" fill="#1e293b" />
                          <rect x="140" y="175" width="8" height="8" fill="#1e293b" />
                          <rect x="160" y="175" width="24" height="8" fill="#1e293b" />
                        </svg>
                      </div>

                      {/* Active Countdown Timer */}
                      <div className="flex items-center justify-center">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                          <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
                          <span>QR Code expires in: <strong className="font-mono text-amber-900 text-sm">{formatTimer(upiTimer)}</strong></span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">
                        Scan with any UPI app to pay <strong className="text-slate-800">₹{subtotal.toLocaleString('en-IN')}</strong> to <strong className="text-indigo-600">shopkart@razorpay</strong>
                      </p>

                      {/* Confirm UPI Payment Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          setShowTestModal(false);
                          const testPaymentId = `pay_upi_${Date.now()}`;
                          await handlePaymentVerification({
                            shopKartOrderId: pendingOrderData.shopKartOrderId,
                            razorpay_order_id: pendingOrderData.razorpayOrderId,
                            razorpay_payment_id: testPaymentId,
                            razorpay_signature: `test_signature_${testPaymentId}`
                          });
                        }}
                        className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>I have Scanned & Approved Payment (Complete Order)</span>
                      </button>

                      {/* Or Enter UPI ID */}
                      <div className="pt-2 border-t border-slate-100 text-left">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Or enter UPI ID / VPA</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={upiIdInput}
                            onChange={(e) => setUpiIdInput(e.target.value)}
                            placeholder="e.g. mobile@upi or yourname@okhdfcbank"
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              setShowTestModal(false);
                              const testPaymentId = `pay_upi_${Date.now()}`;
                              await handlePaymentVerification({
                                shopKartOrderId: pendingOrderData.shopKartOrderId,
                                razorpay_order_id: pendingOrderData.razorpayOrderId,
                                razorpay_payment_id: testPaymentId,
                                razorpay_signature: `test_signature_${testPaymentId}`
                              });
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            Verify & Pay
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer info & Cancel */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Razorpay 256-Bit SSL Encrypted
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTestModal(false)}
                      className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
