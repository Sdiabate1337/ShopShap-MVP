// ShopShap Service Worker - Optimized for Performance
// Version 2.3.0 - Cache strategy with 55min URL expiration

const CACHE_NAME = 'shopshap-v2.3.0';
const STATIC_CACHE = 'shopshap-static-v2.3.0';
const API_CACHE = 'shopshap-api-v2.3.0';
const IMAGE_CACHE = 'shopshap-images-v2.3.0';
const URL_CACHE_DURATION = 55 * 60 * 1000; // 55 minutes (5min safety margin)

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

// API endpoints to cache
const API_PATTERNS = [
  /\/api\//,
  /supabase\.co.*\/storage\/v1\/object\/sign/,
  /supabase\.co.*\/rest\/v1\//
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
  /supabase\.co.*\/storage\/v1\/object\/public/,
  /supabase\.co.*\/storage\/v1\/object\/sign.*\.(png|jpg|jpeg|svg|gif|webp|avif)/i
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Check if request is for static asset
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.startsWith('/_next/static/') ||
         /\.(css|js|woff2?|ttf|eot)$/i.test(url.pathname);
}

// Check if request is for API
function isApiRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.href));
}

// Check if request is for image
function isImageRequest(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.href));
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Handle static assets - Cache first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Static asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 404 });
  }
}

// Handle API requests - Stale while revalidate with signed URL optimization
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Special handling for signed URLs
  if (url.href.includes('/storage/v1/object/sign')) {
    return handleSignedUrlRequest(request);
  }
  
  try {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Return cached response immediately if available
    if (cachedResponse) {
      // Revalidate in background
      fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
      }).catch(() => {
        // Silent fail for background update
      });
      
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      // Cache API responses for shorter duration
      const response = networkResponse.clone();
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ API request failed:', error);
    
    // Try to return cached version as fallback
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ error: 'Service unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle signed URL requests with 55-minute cache optimization
async function handleSignedUrlRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      
      // Check if cached URL is still valid (55 minutes)
      if (cachedAt && (Date.now() - parseInt(cachedAt)) < URL_CACHE_DURATION) {
        console.log('🎯 Using cached signed URL');
        return cachedResponse;
      }
    }
    
    // Fetch new signed URL
    console.log('🔄 Fetching fresh signed URL');
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const response = networkResponse.clone();
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', Date.now().toString());
      headers.set('sw-url-cache', 'true');
      
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Signed URL request failed:', error);
    return fetch(request); // Fallback to network
  }
}

// Handle image requests - Cache first with fallback
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      // Cache images for longer duration
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Image fetch failed:', error);
    
    // Return placeholder image or cached version
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a 1x1 transparent pixel as fallback
    const fallbackImage = new Response(
      new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 255, 255, 255, 0, 0, 0, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache'
        }
      }
    );
    
    return fallbackImage;
  }
}

// Handle navigation requests - Network first with offline fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Navigation request failed:', error);
    
    // Try cached version
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html') || 
           new Response('Offline - Please check your connection', {
             status: 503,
             headers: { 'Content-Type': 'text/html' }
           });
  }
}

// Background sync for analytics and critical data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-analytics') {
    event.waitUntil(syncAnalytics());
  } else if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupExpiredCache());
  }
});

// Sync analytics data when back online
async function syncAnalytics() {
  try {
    // Send queued analytics events
    const analyticsQueue = await getStoredAnalytics();
    if (analyticsQueue.length > 0) {
      await sendAnalytics(analyticsQueue);
      await clearStoredAnalytics();
    }
  } catch (error) {
    console.warn('⚠️ Analytics sync failed:', error);
  }
}

// Clean up expired cache entries
async function cleanupExpiredCache() {
  try {
    const caches_to_check = [API_CACHE, IMAGE_CACHE];
    
    for (const cacheName of caches_to_check) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const cachedAt = response.headers.get('sw-cached-at');
          
          // Remove expired entries (older than 24 hours for images, 1 hour for API)
          const maxAge = cacheName === IMAGE_CACHE ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
          
          if (cachedAt && (Date.now() - parseInt(cachedAt)) > maxAge) {
            console.log('🗑️ Removing expired cache entry:', request.url);
            await cache.delete(request);
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Cache cleanup failed:', error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ cacheSize: size });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'ANALYTICS_EVENT':
      queueAnalyticsEvent(data);
      break;
  }
});

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    totalSize += requests.length;
  }
  
  return totalSize;
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}

// Queue analytics events for offline scenarios
async function queueAnalyticsEvent(eventData) {
  try {
    const stored = await getStoredAnalytics();
    stored.push({
      ...eventData,
      timestamp: Date.now(),
      offline: !navigator.onLine
    });
    
    // Keep only last 100 events
    if (stored.length > 100) {
      stored.splice(0, stored.length - 100);
    }
    
    await storeAnalytics(stored);
  } catch (error) {
    console.warn('⚠️ Failed to queue analytics:', error);
  }
}

// IndexedDB helpers for analytics storage
async function getStoredAnalytics() {
  return new Promise((resolve) => {
    const request = indexedDB.open('ShopShapSW', 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('analytics')) {
        db.createObjectStore('analytics');
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['analytics'], 'readonly');
      const store = transaction.objectStore('analytics');
      const getRequest = store.get('queue');
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result || []);
      };
      
      getRequest.onerror = () => {
        resolve([]);
      };
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

async function storeAnalytics(data) {
  return new Promise((resolve) => {
    const request = indexedDB.open('ShopShapSW', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['analytics'], 'readwrite');
      const store = transaction.objectStore('analytics');
      
      store.put(data, 'queue');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    };
    
    request.onerror = () => resolve();
  });
}

async function clearStoredAnalytics() {
  return storeAnalytics([]);
}

async function sendAnalytics(events) {
  // Implementation depends on your analytics provider
  // This is a placeholder for sending analytics data
  console.log('📊 Syncing analytics events:', events.length);
}

console.log('🚀 ShopShap Service Worker v2.3.0 loaded');