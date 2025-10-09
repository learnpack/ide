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
    // Excluir solicitudes a /socket.io/ y otras URLs que no deben ser cacheadas
    if (event.request.url.includes('/socket.io/') || 
        event.request.url.includes('/api/') ||
        event.request.url.includes('localhost') ||
        event.request.url.includes('devtunnels')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            
            // Solo hacer fetch para recursos estáticos
            if (event.request.method === 'GET' && 
                (event.request.url.includes('.js') || 
                 event.request.url.includes('.css') || 
                 event.request.url.includes('.png') || 
                 event.request.url.includes('.jpg') || 
                 event.request.url.includes('.ico') ||
                 event.request.url.includes('.svg'))) {
                return fetch(event.request).catch(() => {
                    // Si falla el fetch, devolver una respuesta básica
                    return new Response('Resource not available', { status: 404 });
                });
            }
            
            // Para otras solicitudes, no interceptar
            return fetch(event.request);
        }).catch(() => {
            // En caso de error, devolver respuesta básica
            return new Response('Service worker error', { status: 500 });
        })
    );
});
