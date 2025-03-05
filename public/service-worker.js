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
  
  // IMPORTANT: Return null rather than a Response to allow the fetch handler to try network
  return null;
};

// Add specialized caching for iOS/iPad devices
const cacheResourcesForIOS = async () => {
  if (!('caches' in self)) return;
  
  try {
    console.log('[Service Worker] Running iOS-specific resource caching');
    const cache = await caches.open(CACHE_NAME);
    
    // List of critical resources that should be cached for iOS
    const iosSpecificResources = [
      '/',
      '/index.html',
      '/offline.html',
      '/favicon.ico',
      '/logo192.png',
      '/logo512.png',
      '/manifest.json',
      '/static/js/main.chunk.js',
      '/static/js/bundle.js',
      '/static/css/main.chunk.css'
    ];
    
    // Try to cache each resource
    for (const url of iosSpecificResources) {
      try {
        const response = await fetch(url, { cache: 'reload' });
        if (response.ok) {
          await cache.put(url, response);
          console.log(`[Service Worker] iOS cache: Successfully cached ${url}`);
        }
      } catch (err) {
        console.log(`[Service Worker] iOS cache: Failed to cache ${url}`, err);
      }
    }
    
    console.log('[Service Worker] iOS specific caching completed');
  } catch (err) {
    console.error('[Service Worker] iOS specific caching failed:', err);
  }
};

// Detect if client is iOS
self.addEventListener('fetch', event => {
  // Only run this once per client
  const clientId = event.clientId;
  if (clientId && !self.iosClientsDetected) {
    self.iosClientsDetected = self.iosClientsDetected || new Set();
    
    // If we haven't checked this client before
    if (!self.iosClientsDetected.has(clientId)) {
      self.iosClientsDetected.add(clientId);
      
      // Check if this is an iOS client
      clients.get(clientId).then(client => {
        if (client && isIOS(client.userAgent)) {
          console.log('[Service Worker] iOS client detected, running specialized caching');
          cacheResourcesForIOS();
        }
      }).catch(err => {
        console.error('[Service Worker] Error detecting client:', err);
      });
    }
  }
  
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
          const offlineResponse = await findInCache(new Request('/offline.html'));
          
          // If we have the offline page in cache, return it
          if (offlineResponse) {
            console.log('[Service Worker] Returning cached offline.html');
            return offlineResponse;
          }
          
          // As a last resort, create an inline offline response
          console.log('[Service Worker] Creating inline offline response');
          return new Response(
            `<!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - See and Learn</title>
                <style>
                  body { font-family: sans-serif; text-align: center; padding: 20px; }
                  h1 { color: #4b7bec; }
                  button { background: #4b7bec; color: white; border: none; padding: 10px 20px; margin: 10px; border-radius: 5px; }
                </style>
              </head>
              <body>
                <h1>You're Offline</h1>
                <p>Cannot access the app right now. Please check your connection.</p>
                <button onclick="window.location.reload()">Try Again</button>
                <p>Error: Failed to fetch resources</p>
              </body>
            </html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
      })()
    );
    return;
  }

  // Special handling for media files that might have range requests
  if (event.request.headers.get('range')) {
    const url = new URL(event.request.url);
    
    if ((url.pathname.endsWith('.mp4') || 
        url.pathname.endsWith('.webm') || 
        url.pathname.endsWith('.wav') || url.pathname.endsWith('.mp3'))) {
    
      event.respondWith(
        (async () => {
          try {
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
          } catch (err) {
            console.error('[Service Worker] Range request error:', err);
            
            // Always return a valid response, even on error
            try {
              return fetch(event.request);
            } catch (fetchErr) {
              console.error('[Service Worker] Failed to fetch after range error:', fetchErr);
              // Return an empty response with the correct content type as a last resort
              const contentType = event.request.url.endsWith('.mp3') || event.request.url.endsWith('.wav') 
                ? 'audio/mpeg' 
                : 'video/mp4';
              
              return new Response(new ArrayBuffer(0), { 
                status: 206, 
                headers: new Headers({
                  'Content-Type': contentType,
                  'Content-Range': 'bytes 0-0/0',
                  'Content-Length': '0'
                })
              });
            }
          }
        })()
      );
      return;
    }
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
        let client;
        try {
          client = await clients.get(event.clientId);
        } catch (e) {
          console.error('[Service Worker] Error getting client:', e);
        }
        
        const isMobile = client ? isMobileUserAgent(client.userAgent) : false;
        const isIOSDevice = client ? isIOS(client.userAgent) : false;
        
        if (isMobile && isAudioResource) {
          // Force a timeout for audio requests on mobile to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 8000);
          });
          
          // Make sure we have a valid response
          try {
            const fetchPromise = fetch(event.request);
            const response = await Promise.race([fetchPromise, timeoutPromise])
              .catch(err => {
                console.log('[Service Worker] Audio request error or timeout on mobile:', err);
                // Last try from cache
                return findInCache(event.request);
              });
            
            if (response && response.status === 200) {
              try {
                const cache = await caches.open(PRELOAD_CACHE);
                await cache.put(event.request, response.clone());
              } catch (cacheErr) {
                console.error('[Service Worker] Error caching audio response:', cacheErr);
              }
              return response;
            }
            
            // If we get here and still don't have a response, return an empty audio file
            if (!response) {
              console.log('[Service Worker] No response for audio, returning empty audio');
              return new Response(new ArrayBuffer(0), { 
                status: 200, 
                headers: { 'Content-Type': 'audio/mpeg' } 
              });
            }
            
            return response;
          } catch (fetchErr) {
            console.error('[Service Worker] Complete failure fetching audio:', fetchErr);
            return new Response(new ArrayBuffer(0), { 
              status: 200, 
              headers: { 'Content-Type': 'audio/mpeg' } 
            });
          }
        }
        
        // Standard handling for other resources
        try {
          const response = await fetch(event.request);
          if (response && response.status === 200) {
            try {
              const cache = await caches.open(
                isPreloadedResource ? PRELOAD_CACHE : RUNTIME_CACHE
              );
              await cache.put(event.request, response.clone());
            } catch (cacheErr) {
              console.error('[Service Worker] Error caching response:', cacheErr);
            }
          }
          return response;
        } catch (networkErr) {
          throw networkErr; // Re-throw to be caught by the outer catch
        }
      } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        
        // For navigation requests, fallback to offline.html
        if (event.request.mode === 'navigate') {
          const offlineResponse = await findInCache(new Request('/offline.html'));
          if (offlineResponse) {
            return offlineResponse;
          }
        }
        
        // Return a proper response for image files
        if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
          return new Response(new ArrayBuffer(0), {
            status: 200,
            headers: { 'Content-Type': 'image/png' }
          });
        }
        
        // Return a proper response for CSS/JS files
        if (event.request.url.match(/\.(css|js)$/i)) {
          const contentType = event.request.url.endsWith('.css') ? 'text/css' : 'application/javascript';
          return new Response('/* Empty fallback */', {
            status: 200,
            headers: { 'Content-Type': contentType }
          });
        }
        
        // Return 404 for all other uncached assets
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