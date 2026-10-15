import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingBag, Loader2, AlertCircle, PackageX, RotateCcw, Sparkles } from 'lucide-react';
import { getProducts, getWishlist } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params if present
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All Categories';
  const initialSort = searchParams.get('sort') || '';

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch wishlisted product IDs to know which hearts should be active
  const fetchWishlist = useCallback(async () => {
    try {
      const data = await getWishlist();
      if (data && Array.isArray(data.wishlist)) {
        const ids = new Set(data.wishlist.map((item) => (item._id ? item._id.toString() : item.toString())));
        setWishlistIds(ids);
      } else {
        setWishlistIds(new Set());
      }
    } catch (err) {
      setWishlistIds(new Set());
    }
  }, []);

  useEffect(() => {
    fetchWishlist();

    const handleWishlistUpdated = () => {
      fetchWishlist();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
    };
  }, [fetchWishlist]);

  // Fetch products from backend dynamically
  const fetchProducts = useCallback(async (searchQuery, categoryFilter, sortFilter) => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (searchQuery && searchQuery.trim() !== '') {
        params.search = searchQuery.trim();
      }
      if (categoryFilter && categoryFilter !== 'All Categories' && categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      if (sortFilter) {
        params.sort = sortFilter;
      }

      const data = await getProducts(params);
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync state with URL search params and trigger fetch with debounce on search
  useEffect(() => {
    const handler = setTimeout(() => {
      // Update URL query parameters cleanly
      const newParams = {};
      if (search.trim()) newParams.search = search.trim();
      if (category && category !== 'All Categories') newParams.category = category;
      if (sort) newParams.sort = sort;
      setSearchParams(newParams, { replace: true });

      fetchProducts(search, category, sort);
    }, 300);

    return () => clearTimeout(handler);
  }, [search, category, sort, fetchProducts, setSearchParams]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All Categories');
    setSort('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Product Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Discover Products
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            Browse our curated collection of electronics, fashion, books, and home essentials.
          </p>
        </div>

        {!loading && !error && (
          <div className="text-sm font-semibold text-slate-500">
            Showing <span className="text-indigo-600 font-bold">{products.length}</span> {products.length === 1 ? 'product' : 'products'}
          </div>
        )}
      </div>

      {/* Task 7: Search & Filter UI */}
      <SearchBar
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
        onReset={handleResetFilters}
      />

      {/* Main Content Area: Loading, Error, Empty, and List States */}
      <div>
        {/* 1. LOADING STATE */}
        {loading && (
          <div className="min-h-[350px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-100 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <p className="text-base font-semibold text-slate-700">Loading products...</p>
            <p className="text-xs text-slate-400 mt-1">Fetching live inventory from ShopKart backend</p>
          </div>
        )}

        {/* 2. ERROR STATE */}
        {!loading && error && (
          <div className="min-h-[350px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-rose-100 shadow-xs text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Something went wrong while loading products.
            </h3>
            <p className="text-sm text-slate-500 max-w-md mt-1">
              Please check your connection and ensure the backend server is running on port 3000.
            </p>
            <button
              onClick={() => fetchProducts(search, category, sort)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* 3. EMPTY STATE */}
        {!loading && !error && products.length === 0 && (
          <div className="min-h-[350px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <PackageX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No products found.</h3>
            <p className="text-sm text-slate-500 max-w-md mt-1">
              No products match your current search query or category filter. Try clearing your filters or searching for something else.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}

        {/* 4. PRODUCT LISTING (Dynamic Rendering with .map()) */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isWishlistedInitially={wishlistIds.has(product._id ? product._id.toString() : product.toString())}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
