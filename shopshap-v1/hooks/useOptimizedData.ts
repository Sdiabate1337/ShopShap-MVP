/**
 * Optimized data hooks for African mobile users
 * Features:
 * - Mobile-first pagination (8 items per page)
 * - Field selection to reduce data usage
 * - Local caching with expiration
 * - Connection-aware fetching
 * - Background refresh strategies
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  video_url?: string;
  description?: string;
  stock?: number;
  category?: string;
  created_at?: string;
}

interface Shop {
  id: string;
  name: string;
  activity: string;
  city: string;
  slug?: string;
  photo_url?: string;
  description?: string;
  theme?: string;
  created_at?: string;
}

interface PaginationOptions {
  page: number;
  limit: number;
  totalCount?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// Cache manager for offline-first experience
class MobileCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100; // Limit cache size for mobile

  set<T>(key: string, data: T, customExpiry?: number): void {
    const expiry = customExpiry || this.DEFAULT_EXPIRY;
    
    // Clean up old entries if cache is getting too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  cleanup(): void {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    // If still too large, remove oldest entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      const toDelete = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 4));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
    
    console.log(`🧹 Cache cleanup: ${deletedCount} expired entries removed`);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const mobileCache = new MobileCache();

// Hook for optimized product fetching
export function useOptimizedProducts(shopId: string, options: {
  enabled?: boolean;
  mobileOptimized?: boolean;
  fields?: string[];
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const {
    enabled = true,
    mobileOptimized = true,
    fields = ['id', 'name', 'price', 'photo_url', 'description', 'stock'],
    limit = mobileOptimized ? 8 : 12, // Smaller batches for mobile
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 0,
    limit,
    totalCount: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheKey = `products_${shopId}_${JSON.stringify({ fields, sortBy, sortOrder })}`;

  const fetchProducts = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!enabled || !shopId) return;

    // Check cache first for initial load
    if (page === 0 && !append) {
      const cachedData = mobileCache.get<{ products: Product[]; totalCount: number }>(cacheKey);
      if (cachedData) {
        setProducts(cachedData.products);
        setPagination(prev => ({ ...prev, totalCount: cachedData.totalCount }));
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      // Build optimized query
      const from = page * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('products')
        .select(fields.join(','), { count: 'exact' })
        .eq('shop_id', shopId)
        .range(from, to)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Add connection timeout for mobile users
      const { data, error: fetchError, count } = await Promise.race([
        query,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);

      if (fetchError) throw fetchError;

      const newProducts = data || [];
      const totalCount = count || 0;

      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
        // Cache first page for offline access
        mobileCache.set(cacheKey, { products: newProducts, totalCount }, 10 * 60 * 1000); // 10 min cache
      }

      setPagination(prev => ({
        ...prev,
        page,
        totalCount
      }));

      setHasMore(from + newProducts.length < totalCount);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Product fetch error:', err);
        setError(err.message || 'Erreur de chargement des produits');
        
        // Try to use cached data as fallback
        if (page === 0) {
          const cachedData = mobileCache.get<{ products: Product[]; totalCount: number }>(cacheKey);
          if (cachedData) {
            setProducts(cachedData.products);
            setPagination(prev => ({ ...prev, totalCount: cachedData.totalCount }));
            setError('Données hors ligne (connexion limitée)');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, shopId, fields, limit, sortBy, sortOrder, cacheKey]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProducts(pagination.page + 1, true);
    }
  }, [loading, hasMore, pagination.page, fetchProducts]);

  const refresh = useCallback(() => {
    mobileCache.invalidate(cacheKey);
    setPagination(prev => ({ ...prev, page: 0 }));
    setHasMore(true);
    fetchProducts(0, false);
  }, [cacheKey, fetchProducts]);

  // Initial fetch
  useEffect(() => {
    fetchProducts(0, false);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProducts]);

  // Background refresh when network connection is restored
  useEffect(() => {
    const handleOnline = () => {
      console.log('📶 Connection restored - refreshing data');
      refresh();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refresh]);

  return {
    products,
    loading,
    error,
    hasMore,
    pagination,
    loadMore,
    refresh,
    cacheStats: mobileCache.getStats()
  };
}

// Hook for optimized shop fetching
export function useOptimizedShop(slug: string, options: {
  enabled?: boolean;
  fields?: string[];
} = {}) {
  const {
    enabled = true,
    fields = ['id', 'name', 'activity', 'city', 'slug', 'photo_url', 'description', 'theme']
  } = options;

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `shop_${slug}`;

  const fetchShop = useCallback(async () => {
    if (!enabled || !slug) return;

    // Check cache first
    const cachedShop = mobileCache.get<Shop>(cacheKey);
    if (cachedShop) {
      setShop(cachedShop);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await Promise.race([
        supabase
          .from('shops')
          .select(fields.join(','))
          .eq('slug', slug)
          .single(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 8000)
        )
      ]);

      if (fetchError) throw fetchError;

      setShop(data);
      // Cache shop data for longer (shops don't change often)
      mobileCache.set(cacheKey, data, 30 * 60 * 1000); // 30 min cache

    } catch (err: any) {
      console.error('Shop fetch error:', err);
      setError(err.message || 'Erreur de chargement de la boutique');
      
      // Try cached data as fallback
      const cachedShop = mobileCache.get<Shop>(cacheKey);
      if (cachedShop) {
        setShop(cachedShop);
        setError('Données hors ligne (connexion limitée)');
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, slug, fields, cacheKey]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const refresh = useCallback(() => {
    mobileCache.invalidate(cacheKey);
    fetchShop();
  }, [cacheKey, fetchShop]);

  return {
    shop,
    loading,
    error,
    refresh
  };
}

// Hook for connection-aware data fetching
export function useConnectionAwareQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  options: {
    enabled?: boolean;
    staleTime?: number;
    retryOnReconnect?: boolean;
  } = {}
) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    retryOnReconnect = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cachedData = mobileCache.get<T>(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setIsStale(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      setIsStale(false);
      mobileCache.set(cacheKey, result, staleTime);
    } catch (err: any) {
      console.error('Query error:', err);
      setError(err.message);
      
      // Use stale cache data if available
      const staleData = mobileCache.get<T>(cacheKey);
      if (staleData) {
        setData(staleData);
        setIsStale(true);
        setError('Données hors ligne (peut être obsolète)');
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, queryFn, cacheKey, staleTime]);

  // Retry when connection is restored
  useEffect(() => {
    if (!retryOnReconnect) return;

    const handleOnline = () => {
      if (error || isStale) {
        console.log('📶 Retrying query on reconnection');
        fetchData();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [error, isStale, retryOnReconnect, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    mobileCache.invalidate(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh
  };
}

// Utility: Clear all cached data
export function clearMobileCache() {
  mobileCache.clear();
  console.log('🗑️ All mobile cache cleared');
}

// Utility: Get cache statistics
export function getMobileCacheStats() {
  return mobileCache.getStats();
}