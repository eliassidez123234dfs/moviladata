// Service worker placeholder. VitePWA generates a production service worker.
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  self.clients.claim();
});
