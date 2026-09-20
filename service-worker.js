// Bump CACHE_VERSION whenever any app file (including data/categories.js) changes,
// so installed copies pick up the update.
var CACHE_VERSION = "v1";
var CACHE_NAME = "words-are-hard-" + CACHE_VERSION;
var APP_SHELL = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "data/categories.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys
          .filter(function (k) { return k.indexOf("words-are-hard-") === 0 && k !== CACHE_NAME; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Cache-first, falling back to the network (and caching what we fetch).
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (resp) {
        if (resp && resp.ok && new URL(event.request.url).origin === self.location.origin) {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(event.request, copy); });
        }
        return resp;
      }).catch(function () {
        if (event.request.mode === "navigate") return caches.match("index.html");
      });
    })
  );
});
