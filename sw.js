// Animathèque — service worker: keeps the app shell so it opens like an app, even offline.
const CACHE = "animatheque-v26";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  // "reload": take the files from the server, not from the browser's own cache, so a new version is really new.
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // AniList data and images always come from the network.
  if (url.origin !== self.location.origin) return;
  // Pages: network first so updates show up right away (asking the server even if the browser has a copy), cached copy when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
