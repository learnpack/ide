self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    event.waitUntil(
        caches.open('app-cache').then(async (cache) => {
            const urlsToCache = [
                '/',
                '/index.html',
                '/logo-512.png',
                '/logo-192.png',
                '/manifest.webmanifest',
            ];
            const cachePromises = urlsToCache.map(url =>
                fetch(url).then(response => {
                    if (!response.ok) throw new Error(`Error al obtener: ${url}`);
                    return cache.put(url, response.clone());
                }).catch(error => console.warn(error))
            );
            return Promise.all(cachePromises);
        })
    );
});


self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request)
        })
    )
})
