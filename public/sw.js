// =============================================================
// SERVICE WORKER — corre em segundo plano, mesmo com a app fechada.
// Não tem acesso à página (nem DOM, nem React). Só reage a eventos.
// "self" = o próprio service worker (como o "window" numa página).
// =============================================================

// 1) INSTALL — o browser descarregou este ficheiro pela primeira vez
//    (ou uma versão nova dele).
self.addEventListener("install", () => {
  // Por defeito, uma versão nova fica "à espera" até fechares todas as abas.
  // skipWaiting() diz: "ativa-me já".
  self.skipWaiting();
});

// 2) ACTIVATE — o SW passou a ser o ativo.
self.addEventListener("activate", (event) => {
  // clients.claim() faz o SW controlar logo as abas que já estão abertas,
  // sem ser preciso recarregar a página.
  // waitUntil = "browser, não me desligues até isto acabar".
  event.waitUntil(self.clients.claim());
});

// =============================================================
// OFFLINE — estratégia "network first" (primeiro a rede, depois a cache)
// =============================================================
// Sempre que a app pede alguma coisa ao servidor (a página, o JS, o CSS,
// os testes em /api/calendar...), o SW interceta o pedido:
//   - Com internet: vai buscar à rede (dados sempre frescos) e guarda uma
//     cópia na cache.
//   - Sem internet: a rede falha, e devolvemos a cópia guardada.
// Assim, quem já abriu a app uma vez consegue ver os testes no metro,
// sem rede na faculdade, etc.
//
// Mudar este nome "apaga" a cache antiga (ver evento activate abaixo).
const CACHE = "necc-v1";

self.addEventListener("activate", (event) => {
  // Apaga caches de versões antigas (ex.: "necc-v0") para não ocupar espaço.
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Só tratamos pedidos GET do nosso próprio site.
  // (POST = Server Actions, ex.: ativar notificações — esses não se guardam.)
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const resposta = await fetch(req); // 1) tenta a rede
        if (resposta.ok) {
          // Uma Response só pode ser lida uma vez → clone() para guardar uma cópia.
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
        }
        return resposta;
      } catch {
        // 2) sem rede → procura na cache
        const emCache = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
        if (emCache) return emCache;
        // Se for uma página que nunca foi vista, mostramos a página inicial guardada.
        if (req.mode === "navigate") {
          const inicio = await caches.match("/");
          if (inicio) return inicio;
        }
        return Response.error();
      }
    })()
  );
});

// 3) PUSH — chegou uma mensagem do servidor (o nosso cron, mais tarde).
self.addEventListener("push", (event) => {
  // O servidor vai mandar JSON tipo: { "title": "...", "body": "...", "url": "/" }
  // event.data pode vir vazio, por isso temos valores por defeito.
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Se não for JSON válido, usamos o texto como corpo da notificação.
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "NECC Calendário";
  const options = {
    body: data.body || "",
    icon: "/icons/necc-icon-192.png", // ícone grande da notificação
    badge: "/icons/necc-icon-192-monochrome.png", // ícone pequeno (Android, barra de estado)
    data: { url: data.url || "/" }, // guardamos o URL para usar no clique
    // Notificações com a mesma tag substituem-se em vez de se acumularem.
    tag: data.tag,
    renotify: Boolean(data.tag),
  };

  // Sem waitUntil, o browser podia matar o SW antes de a notificação aparecer.
  event.waitUntil(self.registration.showNotification(title, options));
});

// 4) NOTIFICATIONCLICK — o utilizador tocou na notificação.
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // fecha a notificação

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      // Se a app já estiver aberta numa aba, focamos essa aba em vez de abrir outra.
      const abas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const aba of abas) {
        if ("focus" in aba) {
          // navigate() só funciona em abas controladas por este SW; se falhar, focamos na mesma.
          try {
            await aba.navigate(url);
          } catch {}
          return aba.focus();
        }
      }
      // Senão, abrimos uma janela nova.
      return self.clients.openWindow(url);
    })()
  );
});
