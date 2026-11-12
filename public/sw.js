/* global self, clients */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Keep authenticated pages and API responses out of the service worker cache.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || event.request.mode !== "navigate" ||
      url.origin !== self.location.origin || url.pathname !== "/") return;

  event.respondWith(fetch(event.request).catch(() => new Response(
    `<!doctype html>
    <html lang="ckb" dir="rtl">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>پۆلا</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 1rem system-ui; }
      main { padding: 1.5rem; text-align: center; }
    </style>
    <main>
      <h1>ئینتەرنێت بەردەست نییە</h1>
      <p>پەیوەندیی ئینتەرنێتەکەت بپشکنە و دووبارە هەوڵ بدەوە.</p>
      <a href="">دووبارە هەوڵ بدەوە</a>
    </main>
    </html>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  )));
});
