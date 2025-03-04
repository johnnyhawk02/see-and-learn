// Cache names
const CACHE_NAME = 'see-and-learn-cache-v1';
const RUNTIME_CACHE = 'see-and-learn-runtime-v1';
const PRELOAD_CACHE = 'see-and-learn-preload-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png', 
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

// Detect if it's a mobile user agent
const isMobileUserAgent = (userAgent) => {
  return /iPhone|iPad|iPod|Android/i.test(userAgent);
};

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, PRELOAD_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first for preloaded resources, network-first for others
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Check if this is a preloaded resource
  const isPreloadedResource = 
    event.request.url.includes('/images/') || 
    event.request.url.includes('/sounds/vocabulary/') ||
    event.request.url.includes('/sounds/praise/');
  
  // Detect if this is an audio resource
  const isAudioResource = 
    event.request.url.includes('/sounds/vocabulary/') ||
    event.request.url.includes('/sounds/praise/');

  event.respondWith(
    (async () => {
      // Check if the client is mobile
      const client = await clients.get(event.clientId);
      const isMobile = client ? isMobileUserAgent(client.userAgent) : false;
      
      // For preloaded resources, try cache first
      if (isPreloadedResource) {
        const preloadCache = await caches.open(PRELOAD_CACHE);
        const cachedResponse = await preloadCache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      // For all other requests, try network first
      try {
        // Special handling for audio files on mobile
        if (isMobile && isAudioResource) {
          // Force a timeout for audio requests on mobile to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 8000);
          });
          
          const fetchPromise = fetch(event.request);
          const response = await Promise.race([fetchPromise, timeoutPromise])
            .catch(() => {
              console.log('Audio request timeout on mobile, serving from cache if available');
              return caches.match(event.request);
            });
            
          if (response && response.status === 200) {
            const cache = await caches.open(PRELOAD_CACHE);
            cache.put(event.request, response.clone());
          }
          
          return response || new Response('Not found', { status: 404 });
        }
        
        // Standard handling for other resources
        const response = await fetch(event.request);
        if (response.status === 200) {
          const cache = await caches.open(
            isPreloadedResource ? PRELOAD_CACHE : RUNTIME_CACHE
          );
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
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

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle range requests for audio/video
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle range requests for audio files
  if (event.request.headers.has('range') && 
      (url.pathname.endsWith('.wav') || url.pathname.endsWith('.mp3'))) {
    
    event.respondWith(
      caches.open(PRELOAD_CACHE).then(async cache => {
        // Try to find a cached response
        const cachedResponse = await cache.match(event.request.url);
        if (!cachedResponse) {
          // If not in cache, fetch from network
          return fetch(event.request);
        }
        
        // Extract the required range from the request
        const rangeHeader = event.request.headers.get('range');
        const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        const start = parseInt(rangeMatch[1], 10);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : cachedResponse.blob().then(blob => blob.size - 1);
        
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
      }).catch(() => fetch(event.request))
    );
  }
}); 