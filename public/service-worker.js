// Cache names
const CACHE_NAME = 'see-and-learn-cache-v3';
const RUNTIME_CACHE = 'see-and-learn-runtime-v3';
const PRELOAD_CACHE = 'see-and-learn-preload-v3';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css'
];

// This function will try to cache all required resources
// even if they're not in the PRECACHE_ASSETS list
const cacheAdditionalResources = async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Try to cache splash screens and icons if they exist
    const resourcesToPrefetch = [
      // Splash screens from index.html
      '/splashscreens/iphone5_splash.png',
      '/splashscreens/iphone6_splash.png',
      '/splashscreens/iphoneplus_splash.png',
      '/splashscreens/iphonex_splash.png',
      '/splashscreens/ipad_splash.png',
      // Icons from index.html
      '/icons/icon-192x192.png',
      '/icons/icon-152x152.png'
    ];
    
    // For each resource, try to fetch and cache it
    // If it doesn't exist, we'll just catch the error and continue
    for (const resource of resourcesToPrefetch) {
      try {
        const response = await fetch(resource);
        if (response.ok) {
          await cache.put(resource, response);
          console.log(`[Service Worker] Successfully cached additional resource: ${resource}`);
        }
      } catch (err) {
        console.log(`[Service Worker] Resource not available to cache: ${resource}`);
      }
    }
  } catch (err) {
    console.error('[Service Worker] Error caching additional resources:', err);
  }
};

// Detect if it's a mobile user agent
const isMobileUserAgent = (userAgent) => {
  return /iPhone|iPad|iPod|Android/i.test(userAgent);
};

// Detect if it's iOS
const isIOS = (userAgent) => {
  return /iPad|iPhone|iPod/.test(userAgent) && !userAgent.includes('Windows');
};

// Install event - precache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing new service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Successfully installed and precached assets');
        // Try to cache additional resources like icons and splash screens
        return cacheAdditionalResources();
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating new service worker...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, PRELOAD_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        console.log('[Service Worker] Deleting old cache:', cacheToDelete);
        return caches.delete(cacheToDelete);
      }));
    }).then(() => {
      console.log('[Service Worker] Now controlling all clients');
      return self.clients.claim();
    })
  );
});

// Helper function to check all caches for a match
const findInCache = async (request) => {
  // Check in all our caches
  const cacheNames = [PRELOAD_CACHE, CACHE_NAME, RUNTIME_CACHE];
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (err) {
      console.error(`[Service Worker] Error checking cache ${cacheName}:`, err);
    }
  }
  
  // Check older cache versions
  try {
    const oldCacheNames = ['see-and-learn-cache-v2', 'see-and-learn-cache-v1', 'see-and-learn-preload-v2', 'see-and-learn-preload-v1'];
    for (const cacheName of oldCacheNames) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Found in old cache, copy to new cache
        const newCache = await caches.open(CACHE_NAME);
        await newCache.put(request, cachedResponse.clone());
        return cachedResponse;
      }
    }
  } catch (err) {
    console.error('[Service Worker] Error checking old caches:', err);
  }
  
  return null;
};

// Fetch event - handle all requests
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Log requests for debugging
  console.log(`[Service Worker] Fetching resource: ${event.request.url}`);

  // Handle navigation requests (like opening the app)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try to fetch the page from the network first
          console.log('[Service Worker] Navigation request, trying network first');
          const networkResponse = await fetch(event.request);
          
          // Cache the fresh page
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(event.request, networkResponse.clone());
          
          return networkResponse;
        } catch (error) {
          console.log('[Service Worker] Navigation request failed, falling back to cache', error);
          
          // If we're offline, try to serve from cache
          const cachedResponse = await findInCache(event.request);
          if (cachedResponse) {
            console.log('[Service Worker] Serving navigation from cache');
            return cachedResponse;
          }
          
          // If no cached navigation response, try to serve the index.html from cache
          console.log('[Service Worker] Trying to serve index.html from cache');
          const indexResponse = await findInCache(new Request('/index.html'));
          if (indexResponse) {
            console.log('[Service Worker] Serving index.html from cache');
            return indexResponse;
          }
          
          // If that fails too, show the offline page
          console.log('[Service Worker] Falling back to offline.html');
          return findInCache(new Request('/offline.html'));
        }
      })()
    );
    return;
  }

  // Check if this is a preloaded resource
  const isPreloadedResource = 
    event.request.url.includes('/images/') || 
    event.request.url.includes('/card-images/') || 
    event.request.url.includes('/sounds/vocabulary/') ||
    event.request.url.includes('/sounds/praise/');
  
  // Detect if this is an audio resource
  const isAudioResource = 
    event.request.url.includes('/sounds/vocabulary/') ||
    event.request.url.includes('/sounds/praise/');

  event.respondWith(
    (async () => {
      // First check if we have it in any cache
      const cachedResponse = await findInCache(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Try network if not in cache
      try {
        // Special handling for audio files on mobile
        const client = await clients.get(event.clientId);
        const isMobile = client ? isMobileUserAgent(client.userAgent) : false;
        
        if (isMobile && isAudioResource) {
          // Force a timeout for audio requests on mobile to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 8000);
          });
          
          const fetchPromise = fetch(event.request);
          const response = await Promise.race([fetchPromise, timeoutPromise])
            .catch(() => {
              console.log('Audio request timeout on mobile, serving from cache if available');
              return findInCache(event.request);
            });
            
          if (response && response.status === 200) {
            const cache = await caches.open(PRELOAD_CACHE);
            cache.put(event.request, response.clone());
          }
          
          return response || new Response('Not found', { status: 404 });
        }
        
        // Standard handling for other resources
        const response = await fetch(event.request);
        if (response && response.status === 200) {
          const cache = await caches.open(
            isPreloadedResource ? PRELOAD_CACHE : RUNTIME_CACHE
          );
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        console.error('Fetch failed:', error);
        
        // For navigation requests, fallback to offline.html
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        
        // Return 404 for uncached assets
        return new Response('Not found', {
          status: 404,
          statusText: 'Not found'
        });
      }
    })()
  );
});

// Add a message handler to respond to messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    console.log('[Service Worker] Skip waiting and activating new service worker');
  }
  
  if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
    console.log('[Service Worker] Checking for updates...');
    // Force cache update by re-fetching some key resources
    caches.open(CACHE_NAME).then(cache => {
      cache.add('/index.html').then(() => {
        console.log('[Service Worker] Re-cached index.html');
      }).catch(err => {
        console.error('[Service Worker] Failed to re-cache index.html', err);
      });
    });
  }
  
  if (event.data && event.data.type === 'CACHE_ALL_RESOURCES') {
    console.log('[Service Worker] Caching all resources requested by client');
    // Use the additional resources cacher
    cacheAdditionalResources().then(() => {
      // If the client provided a callback channel, post back when done
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: 'CACHE_COMPLETE',
          success: true
        });
      }
    }).catch(err => {
      console.error('[Service Worker] Failed to cache additional resources', err);
      // Notify client of failure
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: 'CACHE_COMPLETE',
          success: false,
          error: err.message
        });
      }
    });
  }
});

// Handle range requests for audio/video
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle range requests for audio files
  if (event.request.headers.has('range') && 
      (url.pathname.endsWith('.wav') || url.pathname.endsWith('.mp3'))) {
    
    event.respondWith(
      (async () => {
        // Try to find a cached response in any cache
        let cachedResponse = null;
        const cacheNames = [PRELOAD_CACHE, CACHE_NAME, RUNTIME_CACHE];
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const response = await cache.match(event.request.url);
          if (response) {
            cachedResponse = response;
            break;
          }
        }
        
        if (!cachedResponse) {
          // If not in cache, fetch from network
          return fetch(event.request);
        }
        
        // Extract the required range from the request
        const rangeHeader = event.request.headers.get('range');
        const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        const start = parseInt(rangeMatch[1], 10);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : await cachedResponse.blob().then(blob => blob.size - 1);
        
        // Clone the response and create a new response with the requested range
        return cachedResponse.blob().then(blob => {
          const slicedBlob = blob.slice(start, end + 1);
          const slicedResponse = new Response(slicedBlob, {
            status: 206,
            statusText: 'Partial Content',
            headers: new Headers({
              'Content-Type': cachedResponse.headers.get('Content-Type'),
              'Content-Range': `bytes ${start}-${end}/${blob.size}`,
              'Content-Length': slicedBlob.size
            })
          });
          return slicedResponse;
        });
      })().catch(() => fetch(event.request))
    );
  }
}); 