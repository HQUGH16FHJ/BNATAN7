const CACHE_NAME = 'bantan-static-v4.0.7-premium-15';
const CORE_ASSETS = [
  '/',
  '/landing.html',
  '/index.html',
  '/changelog.html',
  '/changelog.json',
  '/feed.xml',
  '/license.html',
  '/license.json',
  '/manifest.json',
  '/llms.txt',
  '/favicon.svg',
  '/xiaobantan.svg',
  '/xiaobantan-v2.svg',
  '/xiaobantan-thinking.svg',
  '/xiaobantan-happy.svg',
  '/xiaobantan-alert.svg',
  '/confirm-dialog.css',
  '/confirm-dialog.js',
  '/profile-center.css',
  '/profile-center.js',
  '/legacy-tools.js',
  '/experience-v4.css',
  '/experience-v4.js',
  '/reactbits-v4.css',
  '/reactbits-v4.js',
  '/uiverse-v4.css',
  '/uiverse-v4.js',
  '/advanced-motion-v4.css',
  '/advanced-motion-v4.js',
  '/mascot-state.css',
  '/mascot-state.js',
  '/ui-interactions-v4.css',
  '/ui-interactions-v4.js',
  '/archive-v5.css',
  '/archive-v5.js',
  '/official-domains-v1.css',
  '/official-domains-v1.js',
  '/premium-finish-v1.css',
  '/site-pages-v1.css',
  '/site-pages-v1.js',
  '/premium-tools-v1.css',
  '/premium-tools-v1.js',
  '/copyright/',
  '/copyright/copyright.css',
  '/copyright/copyright.js',
  '/copyright/rights-console-v1.css',
  '/copyright/sites.html',
  '/copyright/sites.js',
  '/copyright/register.html',
  '/copyright/register.js',
  '/copyright/status.html',
  '/copyright/status.js',
  '/copyright/site.html',
  '/copyright/site.js',
  '/copyright/certificate.html',
  '/copyright/certificate.css',
  '/copyright/certificate.js',
  '/explore.html',
  '/trust.html',
  '/domain.html',
  '/collections.html',
  '/new.html',
  '/guides/',
  '/story.html',
  '/timeline.html',
  '/developers.html',
  '/privacy.html',
  '/security.html',
  '/status.html',
  '/verify.html',
  '/offline.html',
  '/brand.html',
  '/about.html',
  '/about-v4.css',
  '/about-podcast.css',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return (await caches.match('/offline.html')) || caches.match('/landing.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
