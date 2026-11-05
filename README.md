# NECC Calendário

PWA com o calendário de testes, entregas e eventos de LCC, com avisos por notificação push.

## Funcionalidades

- **Instalável** no ecrã principal (Android, iPhone, PC) — `public/manifest.json` + `app/components/InstallPrompt.tsx`
- **Funciona offline** — o service worker (`public/sw.js`) guarda a última versão das datas
- **Estrelas ⭐ + notificações push**: ao dar estrela a um teste, a app pede logo permissão; a partir de uma semana antes recebes um aviso **todos os dias às 10h** (hora de Lisboa) com o tempo que falta, até ao próprio dia

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # e preenche (ver abaixo)
npm run dev
```

Sem as variáveis do Redis, as subscrições ficam em memória (perdem-se ao reiniciar) — chega para testar.

Disparar o cron à mão:

```bash
# ?force=1 ignora a verificação "são 10h em Lisboa?"
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/notify?force=1"
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
5. Os crons em `vercel.json` correm às **09:00 e 10:00 UTC**; o código só envia na chamada em que são **10h em Lisboa** (assim funciona na hora de inverno e de verão). No plano gratuito a Vercel pode atrasar até ~1h dentro dessa hora.
6. Para verificar a configuração: abre `/api/push/health` — tem de dar `"ok": true`.

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
| `hooks/useStarred.ts` | Testes com estrela (guardados no dispositivo) |
| `app/components/calendar/NotificationSettings.tsx` | Interruptor "Avisos dos testes" nos filtros |

## Notas sobre iPhone

As notificações só funcionam com **iOS 16.4+** e com a app **instalada no ecrã principal** (Partilhar → Adicionar ao ecrã principal) e aberta a partir do ícone.
