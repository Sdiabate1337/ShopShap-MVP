import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type Product = {
  id: string;
  name: string;
  price: number;
  photo_url: string | null;
  video_url: string | null;
  description: string | null;
  stock: number | null;
  shop_id: string;
  created_at: string;
  category?: string;
};

export type ProductWithUrls = Product & {
  signedPhotoUrl: string | null;
  signedVideoUrl: string | null;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
  sortBy: 'recent' | 'name' | 'price';
  searchTerm?: string;
};

export type CachedData = {
  products: ProductWithUrls[];
  totalCount: number;
  lastFetch: number;
  params: PaginationParams;
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const URL_CACHE_DURATION = 55 * 60 * 1000; // 55 minutes (5min safety margin)
const DEFAULT_PAGE_SIZE = 12;

export function useProductsCache(shopId: string | null) {
  const [cache, setCache] = useState<Map<string, CachedData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlCacheRef = useRef<Map<string, { url: string; expiry: number }>>(new Map());

  // Générer la clé de cache basée sur les paramètres
  const getCacheKey = useCallback((params: PaginationParams): string => {
    return `${shopId}-${params.page}-${params.pageSize}-${params.sortBy}-${params.searchTerm || ''}`;
  }, [shopId]);

  // Vérifier si les données en cache sont valides
  const isCacheValid = useCallback((cachedData: CachedData): boolean => {
    return Date.now() - cachedData.lastFetch < CACHE_DURATION;
  }, []);

  // Générer les URLs signées avec cache optimisé (55 minutes)
  const getSignedUrl = useCallback(async (
    bucket: string, 
    path: string, 
    expiresIn = 3600
  ): Promise<string | null> => {
    const cacheKey = `${bucket}:${path}`;
    const cached = urlCacheRef.current.get(cacheKey);
    
    // Vérifier si l'URL en cache est encore valide (avec marge de sécurité de 5 minutes)
    if (cached && cached.expiry > Date.now() + (5 * 60 * 1000)) {
      return cached.url;
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      
      if (error || !data?.signedUrl) {
        return null;
      }
      
      // Mettre en cache l'URL avec expiration de 55 minutes
      urlCacheRef.current.set(cacheKey, {
        url: data.signedUrl,
        expiry: Date.now() + URL_CACHE_DURATION
      });
      
      return data.signedUrl;
    } catch (err) {
      return null;
    }
  }, []);

  // Traiter les produits avec URLs signées en lot (batch processing)
  const processProductsWithUrls = useCallback(async (products: Product[]): Promise<ProductWithUrls[]> => {
    // Grouper les requêtes par bucket pour optimiser les appels
    const photoRequests = products
      .filter(p => p.photo_url)
      .map(p => ({ product: p, bucket: 'shop-photos', path: p.photo_url! }));
    
    const videoRequests = products
      .filter(p => p.video_url)
      .map(p => ({ product: p, bucket: 'product-videos', path: p.video_url! }));

    // Traiter les photos en parallèle
    const photoResults = await Promise.allSettled(
      photoRequests.map(async ({ product, bucket, path }) => ({
        productId: product.id,
        url: await getSignedUrl(bucket, path)
      }))
    );

    // Traiter les vidéos en parallèle
    const videoResults = await Promise.allSettled(
      videoRequests.map(async ({ product, bucket, path }) => ({
        productId: product.id,
        url: await getSignedUrl(bucket, path)
      }))
    );

    // Créer des maps pour accès rapide
    const photoMap = new Map<string, string | null>();
    const videoMap = new Map<string, string | null>();

    photoResults.forEach(result => {
      if (result.status === 'fulfilled') {
        photoMap.set(result.value.productId, result.value.url);
      }
    });

    videoResults.forEach(result => {
      if (result.status === 'fulfilled') {
        videoMap.set(result.value.productId, result.value.url);
      }
    });

    // Construire le résultat final
    return products.map(product => ({
      ...product,
      signedPhotoUrl: photoMap.get(product.id) || null,
      signedVideoUrl: videoMap.get(product.id) || null
    }));
  }, [getSignedUrl]);

  // Construire la requête Supabase avec filtres et tri
  const buildQuery = useCallback((params: PaginationParams) => {
    if (!shopId) return null;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('shop_id', shopId);

    // Filtre de recherche
    if (params.searchTerm?.trim()) {
      const searchTerm = params.searchTerm.trim();
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Tri
    switch (params.sortBy) {
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'price':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    return query;
  }, [shopId]);

  // Récupérer les produits avec cache
  const fetchProducts = useCallback(async (params: PaginationParams): Promise<CachedData> => {
    const cacheKey = getCacheKey(params);
    const cachedData = cache.get(cacheKey);

    // Retourner les données en cache si valides
    if (cachedData && isCacheValid(cachedData)) {
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      // Vérifier la connexion utilisateur
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Erreur de session: ' + sessionError.message);
      }
      
      if (!session?.user) {
        throw new Error('Utilisateur non connecté');
      }

      const query = buildQuery(params);
      if (!query) {
        throw new Error('Shop ID manquant');
      }

      const { data, error: queryError, count } = await query;
      
      if (queryError) {
        // Gérer différents types d'erreurs Supabase
        if (queryError.code === 'PGRST116') {
          throw new Error('Aucune donnée trouvée');
        } else if (queryError.code === 'PGRST301') {
          throw new Error('Problème de permissions');
        } else if (queryError.message.includes('Failed to fetch')) {
          throw new Error('Problème de connexion réseau');
        } else {
          throw new Error('Erreur de base de données: ' + queryError.message);
        }
      }

      // Traiter les produits avec URLs signées
      const productsWithUrls = data ? await processProductsWithUrls(data) : [];

      const newCachedData: CachedData = {
        products: productsWithUrls,
        totalCount: count || 0,
        lastFetch: Date.now(),
        params
      };

      // Mettre à jour le cache
      setCache(prev => new Map(prev).set(cacheKey, newCachedData));

      return newCachedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cache, getCacheKey, isCacheValid, buildQuery, processProductsWithUrls]);

  // Invalider le cache
  const invalidateCache = useCallback((shopId?: string) => {
    if (shopId) {
      // Invalider seulement pour un shop spécifique
      const keysToDelete = Array.from(cache.keys()).filter(key => key.startsWith(`${shopId}-`));
      const newCache = new Map(cache);
      keysToDelete.forEach(key => newCache.delete(key));
      setCache(newCache);
    } else {
      // Invalider tout le cache
      setCache(new Map());
    }
    
    // Nettoyer aussi le cache des URLs
    urlCacheRef.current.clear();
    
    // Réinitialiser l'état d'erreur
    setError(null);
  }, [cache]);

  // Nettoyer le cache expiré
  const cleanExpiredCache = useCallback(() => {
    const newCache = new Map(cache);
    let hasChanges = false;

    for (const [key, data] of cache.entries()) {
      if (!isCacheValid(data)) {
        newCache.delete(key);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setCache(newCache);
    }

    // Nettoyer les URLs expirées
    const now = Date.now();
    const urlCache = urlCacheRef.current;
    for (const [key, data] of urlCache.entries()) {
      if (data.expiry <= now) {
        urlCache.delete(key);
      }
    }
  }, [cache, isCacheValid]);

  // Nettoyage automatique du cache expiré
  useEffect(() => {
    const interval = setInterval(cleanExpiredCache, 60000); // Chaque minute
    return () => clearInterval(interval);
  }, [cleanExpiredCache]);

  return {
    fetchProducts,
    invalidateCache,
    loading,
    error,
    cacheSize: cache.size,
    urlCacheSize: urlCacheRef.current.size
  };
}