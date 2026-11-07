// Mudar este nome apaga a cache antiga no evento activate.
const CACHE = "necc-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((names) =>
        Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
      ),
    ]),
  );
});

// Primeiro a rede, com a cache como recurso quando não há ligação.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      } catch {
        const cached = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
        if (cached) return cached;
        if (req.mode === "navigate") {
          const home = await caches.match("/");
          if (home) return home;
        }
        return Response.error();
      }
    })(),
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "NECC Calendário", {
      body: data.body || "",
      icon: "/icons/necc-icon-192.png",
      badge: "/icons/necc-icon-192-monochrome.png",
      data: { url: data.url || "/" },
      tag: data.tag,
      renotify: Boolean(data.tag),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const win of windows) {
        if ("focus" in win) {
          // navigate() falha em janelas não controladas por este service worker.
          try {
            await win.navigate(url);
          } catch {}
          return win.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
