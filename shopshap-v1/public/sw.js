// Service Worker for ShopShap - Optimized for African Mobile Users
// Version: 2.0.0 - Aggressive caching for 3G/4G connections

const CACHE_NAME = 'shopshap-v2.0.0';
const API_CACHE_NAME = 'shopshap-api-v2.0.0';
const IMAGE_CACHE_NAME = 'shopshap-images-v2.0.0';

// Cache duration configurations (longer for African mobile users)
const CACHE_DURATION = {
  static: 365 * 24 * 60 * 60 * 1000, // 1 year for static assets
  api: 24 * 60 * 60 * 1000, // 1 day for API responses
  images: 30 * 24 * 60 * 60 * 1000, // 30 days for images
  offline: 7 * 24 * 60 * 60 * 1000, // 1 week for offline pages
};

// Critical resources to cache immediately
const CRITICAL_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Static assets patterns
const STATIC_ASSETS = [
  /\/_next\/static\/.*/,
  /\.(?:js|css|png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2)$/,
  /\/icons\/.*/,
  /\/images\/.*/,
];

// API patterns for Supabase
const API_PATTERNS = [
  /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
  /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/,
];

// Image patterns
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|gif|webp|avif)$/i,
  /\/storage\/v1\/object\/public\/.*/,
];

// Install event - Pre-cache critical resources
self.addEventListener('install', (event) => {
  console.log('🚀 ShopShap SW v2.0.0 installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('📦 Pre-caching critical resources...');
        
        // Cache critical resources with error handling
        const cachePromises = CRITICAL_CACHE_URLS.map(async (url) => {
          try {
            await cache.add(url);
            console.log(`✅ Cached: ${url}`);
          } catch (error) {
            console.warn(`⚠️ Failed to cache ${url}:`, error);
          }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('✅ Critical resources cached successfully');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('❌ Service worker install failed:', error);
      }
    })()
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 ShopShap SW v2.0.0 activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Take control of all pages immediately
        await self.clients.claim();
        
        // Clean up old caches
        const cacheNames = await caches.keys();
        const validCacheNames = [CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME];
        
        const deletePromises = cacheNames
          .filter(cacheName => !validCacheNames.includes(cacheName))
          .map(async (cacheName) => {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          });
        
        await Promise.all(deletePromises);
        console.log('✅ Old caches cleaned up');
        
        // Clean up expired entries
        await cleanupExpiredEntries();
        
      } catch (error) {
        console.error('❌ Service worker activation failed:', error);
      }
    })()
  );
});

// Fetch event - Intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Main request handling logic
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Static assets - Cache First (aggressive caching for mobile)
    if (isStaticAsset(url)) {
      return await cacheFirst(request, CACHE_NAME);
    }
    
    // Strategy 2: Images - Cache First with optimization
    if (isImage(url)) {
      return await cacheFirstWithOptimization(request, IMAGE_CACHE_NAME);
    }
    
    // Strategy 3: API calls - Network First with long fallback
    if (isApiCall(url)) {
      return await networkFirstWithFallback(request, API_CACHE_NAME);
    }
    
    // Strategy 4: Navigation requests - Network First with offline page
    if (request.mode === 'navigate') {
      return await networkFirstWithOfflinePage(request);
    }
    
    // Default: Network only for other requests
    return await fetch(request);
    
  } catch (error) {
    console.error('❌ Request handling failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline');
      return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network error', { status: 503 });
  }
}

// Cache First strategy for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is expired
    const cacheTime = getCacheTime(cachedResponse);
    if (cacheTime && Date.now() - cacheTime < CACHE_DURATION.static) {
      console.log(`📦 Cache hit: ${request.url}`);
      return cachedResponse;
    }
  }
  
  try {
    console.log(`🌐 Fetching: ${request.url}`);
    const response = await fetch(request);
    
    if (response.ok) {
      const responseToCache = response.clone();
      // Add timestamp for cache management
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      await cache.put(request, modifiedResponse);
      console.log(`💾 Cached: ${request.url}`);
    }
    
    return response;
  } catch (error) {
    console.warn(`⚠️ Network failed, returning cache: ${request.url}`);
    return cachedResponse || new Response('Resource not available offline', { status: 503 });
  }
}

// Cache First with image optimization
async function cacheFirstWithOptimization(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cacheTime = getCacheTime(cachedResponse);
    if (cacheTime && Date.now() - cacheTime < CACHE_DURATION.images) {
      return cachedResponse;
    }
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      await cache.put(request, modifiedResponse);
    }
    
    return response;
  } catch (error) {
    return cachedResponse || new Response('Image not available offline', { status: 503 });
  }
}

// Network First with fallback for API calls
async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 5000) // 5s timeout for African mobile
      )
    ]);
    
    if (response.ok) {
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      await cache.put(request, modifiedResponse);
    }
    
    return response;
  } catch (error) {
    console.warn(`⚠️ Network failed for API, trying cache: ${request.url}`);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cacheTime = getCacheTime(cachedResponse);
      if (cacheTime && Date.now() - cacheTime < CACHE_DURATION.api) {
        // Add header to indicate stale data
        const headers = new Headers(cachedResponse.headers);
        headers.set('sw-cache-stale', 'true');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers,
        });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Data not available offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Network First with offline page for navigation
async function networkFirstWithOfflinePage(request) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Navigation timeout')), 8000) // 8s timeout for navigation
      )
    ]);
    
    if (response.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(CACHE_NAME);
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      await cache.put(request, modifiedResponse);
    }
    
    return response;
  } catch (error) {
    console.warn(`⚠️ Navigation failed, checking cache: ${request.url}`);
    
    // Try to return cached version
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await cache.match('/offline');
    return offlineResponse || new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hors ligne - ShopShap</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; text-align: center; padding: 50px; background: #0a0a0a; color: white; }
            h1 { color: #3b82f6; }
            .retry { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; margin: 20px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1>📱 Hors ligne</h1>
          <p>Vous êtes actuellement hors ligne. Cette page sera disponible dès que votre connexion sera rétablie.</p>
          <button class="retry" onclick="window.location.reload()">Réessayer</button>
          <p><small>ShopShap - Optimisé pour l'Afrique</small></p>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Utility functions
function isStaticAsset(url) {
  return STATIC_ASSETS.some(pattern => pattern.test(url.pathname + url.search));
}

function isImage(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname + url.search));
}

function isApiCall(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.href));
}

function getCacheTime(response) {
  const cacheTimeHeader = response.headers.get('sw-cache-time');
  return cacheTimeHeader ? parseInt(cacheTimeHeader, 10) : null;
}

// Clean up expired cache entries
async function cleanupExpiredEntries() {
  const cacheNames = [CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const cacheTime = getCacheTime(response);
          let maxAge = CACHE_DURATION.static; // default
          
          if (cacheName === API_CACHE_NAME) maxAge = CACHE_DURATION.api;
          if (cacheName === IMAGE_CACHE_NAME) maxAge = CACHE_DURATION.images;
          
          if (cacheTime && Date.now() - cacheTime > maxAge) {
            await cache.delete(request);
            console.log(`🗑️ Expired cache entry removed: ${request.url}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Cache cleanup failed for ${cacheName}:`, error);
    }
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      (async () => {
        console.log('🔄 Background sync triggered');
        // Invalidate API cache to fetch fresh data
        await caches.delete(API_CACHE_NAME);
        console.log('✅ API cache invalidated for fresh data');
      })()
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CACHE_URLS') {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(event.data.urls);
        console.log('✅ Additional URLs cached');
      })()
    );
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ All caches cleared');
      })()
    );
  }
});

console.log('🚀 ShopShap Service Worker v2.0.0 loaded - Optimized for African Mobile Users');