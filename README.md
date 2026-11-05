# NECC Calendário

PWA com o calendário de testes, entregas e eventos de LCC, com avisos por notificação push.

## Funcionalidades

- **Instalável** no ecrã principal (Android, iPhone, PC) — `public/manifest.json` + `app/components/InstallPrompt.tsx`
- **Funciona offline** — o service worker (`public/sw.js`) guarda a última versão das datas
- **Notificações push** na véspera e uma semana antes de cada avaliação, só das UCs que a pessoa tem nos filtros
- **Partilhar** um teste pelo menu nativo do telemóvel

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # e preenche (ver abaixo)
npm run dev
```

Sem as variáveis do Redis, as subscrições ficam em memória (perdem-se ao reiniciar) — chega para testar.

Disparar o cron à mão:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/notify
```

## Deploy na Vercel

1. **Importar o projeto**: vercel.com → *Add New → Project* → escolher o repositório do GitHub.
2. **Base de dados**: no projeto, *Storage* (ou *Marketplace*) → **Upstash → Redis** → criar (plano gratuito) e ligar ao projeto. Isto cria sozinho as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
3. **Variáveis de ambiente**: *Settings → Environment Variables*, adicionar (os valores estão no teu `.env.local`):
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (ex.: `mailto:email-do-necc@...`)
   - `CRON_SECRET`
4. **Redeploy** (as variáveis só entram num deploy novo).
5. O cron em `vercel.json` corre todos os dias às **18:00 UTC** (18h/19h em Lisboa). No plano gratuito pode atrasar até ~1h.

⚠️ Usa sempre as **mesmas chaves VAPID**: se as mudares, todas as subscrições existentes deixam de funcionar.

## Onde está o quê

| Ficheiro | O que faz |
|---|---|
| `lib/calendar-data.ts` | **Lista de testes** — editar aqui para adicionar/mudar datas |
| `lib/subjects.ts` | Lista de UCs (usada nos filtros e nas notificações) |
| `public/sw.js` | Service worker: offline + mostrar notificações |
| `app/actions.ts` | Server Actions: subscrever/desubscrever/teste |
| `lib/push-store.ts` | Guarda as subscrições (Redis ou memória) |
| `lib/notify.ts` | Decide quem recebe o quê (corre no cron) |
| `app/api/cron/notify/route.ts` | Endpoint chamado pela Vercel todos os dias |
| `hooks/usePushNotifications.ts` | Lógica de push no browser |
| `app/components/calendar/NotificationSettings.tsx` | Interruptor "Avisos dos testes" nos filtros |

## Notas sobre iPhone

As notificações só funcionam com **iOS 16.4+** e com a app **instalada no ecrã principal** (Partilhar → Adicionar ao ecrã principal) e aberta a partir do ícone.
