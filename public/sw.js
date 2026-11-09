// Service worker: corre em segundo plano, mesmo com a app fechada.
// Guarda as datas para funcionar sem ligação e mostra as notificações.

// Mudar este nome apaga a cache antiga no evento activate.
const CACHE = "necc-v1";

// Estrelas à espera de internet. Não muda com as versões da cache: não se podem perder.
const PENDING_CACHE = "necc-pending";
const PENDING_STARS_URL = "/__pending-stars";

// Com rede lenta, passado este tempo responde com a cache.
const NETWORK_TIMEOUT_MS = 2000;

// Sem isto, quem abre a app uma única vez não teria nada guardado para a abrir sem ligação.
const APP_SHELL = ["/", "/api/calendar"];

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE);
  await Promise.allSettled(
    urls.map(async (url) => {
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
    }),
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(cacheUrls(APP_SHELL));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((names) =>
        Promise.all(
          names.filter((n) => n !== CACHE && n !== PENDING_CACHE).map((n) => caches.delete(n)),
        ),
      ),
    ]),
  );
});

// A página envia os ficheiros que já carregou antes de o service worker estar ativo.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "precache" || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((u) => {
    const url = new URL(u, self.location.origin);
    return url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
  });
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const missing = [];
      for (const url of urls) if (!(await cache.match(url))) missing.push(url);
      await cacheUrls(missing);
    })(),
  );
});

async function fromCache(req) {
  // ignoreVary: as respostas do Next variam com cabeçalhos que aqui não interessam.
  const options = { ignoreVary: true, ignoreSearch: req.mode === "navigate" };
  const cached = await caches.match(req, options);
  if (cached || req.mode !== "navigate") return cached;
  return caches.match("/", options);
}

// Primeiro a rede, mas sem deixar a pessoa à espera: se falhar ou demorar, usa a cache
// e a resposta da rede, quando chegar, fica guardada para a próxima vez.
async function networkFirst(event, req) {
  const network = fetch(req).then(async (res) => {
    if (res.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(req, res.clone());
    }
    return res;
  });
  event.waitUntil(network.catch(() => {}));

  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(resolve, NETWORK_TIMEOUT_MS, null);
  });
  const res = await Promise.race([network.catch(() => null), timeout]);
  clearTimeout(timer);
  if (res) return res;

  // Sem nada guardado, a única hipótese é continuar à espera da rede.
  return (await fromCache(req)) ?? network.catch(() => Response.error());
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(event, req));
});

// Voltou a internet (mesmo com a app fechada): envia as estrelas que ficaram por enviar.
async function flushPendingStars() {
  const cache = await caches.open(PENDING_CACHE);
  const pending = await cache.match(PENDING_STARS_URL);
  if (!pending) return;

  const sub = await self.registration.pushManager.getSubscription();
  if (sub) {
    const res = await fetch("/api/push/starred", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint, starred: await pending.json() }),
    });
    // Lançar um erro faz o browser tentar outra vez mais tarde.
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
  }
  await cache.delete(PENDING_STARS_URL);
}

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-stars") event.waitUntil(flushPendingStars());
});

// Chegou um aviso do servidor: mostra a notificação.
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
      // O Android só usa a transparência desta imagem: tem de ser branco sobre transparente.
      badge: "/icons/necc-badge-96.png",
      data: { url: data.url || "/" },
      tag: data.tag,
      renotify: Boolean(data.tag),
    }),
  );
});

// Tocar na notificação abre a app no dia do teste.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const win of windows) {
        if ("focus" in win) {
          // navigate() falha em janelas que este service worker não controla.
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
