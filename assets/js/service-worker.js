self.addEventListener('install', function(event) {
    console.log('Service Worker installing.');
    event.waitUntil(
        caches.open('project2025-cache').then(function(cache) {
            return cache.addAll([
                '/',
                '/index.html',
                '/assets/css/styles.css',
                '/assets/js/main.js',
                '/assets/images/logo.webp'
            ]);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
