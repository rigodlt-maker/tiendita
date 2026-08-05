// sw.js — cache básico del app-shell. La lógica de datos (Firestore)
// NO se cachea aquí; Firestore ya maneja su propia persistencia offline.
const CACHE_NAME = "tienda-indi-shell-v3";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./tienda.html",
  "./css/style.css",
  "./js/app.js",
  "./js/firebase-config.js",
  "./js/companeros.js",
  "./js/productos.js",
  "./js/scanner.js",
  "./js/ventas.js",
  "./js/vender-ui.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Solo aplicamos estrategia cache-first al app-shell (mismo origen, GET).
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
