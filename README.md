# NECC Calendário

PWA com o calendário de testes, entregas e eventos de LCC, com avisos por notificação push.

## Funcionalidades

- Instalável no ecrã principal (Android, iPhone e computador)
- Funciona sem ligação, com as últimas datas guardadas
- Avisos dos testes com estrela: um por dia, às 10h em Lisboa, desde uma semana antes até ao próprio dia. Dar uma estrela liga os avisos; só é preciso ir aos filtros para os desligar

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sem as variáveis do Redis, as subscrições ficam em memória e perdem-se ao reiniciar.

Para disparar o cron à mão (`?force=1` ignora a hora e os avisos já entregues):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/notify?force=1"
```

## Deploy na Vercel

1. Importar o repositório em vercel.com.
2. Em Storage ou Marketplace, criar uma base de dados Upstash Redis e ligá-la ao projeto. Isto cria `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
3. Em Settings, Environment Variables, adicionar para o ambiente Production:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`, com um contacto real
   - `CRON_SECRET`
4. Fazer redeploy, porque as variáveis só entram num deploy novo.
5. Abrir `/api/push/health` e confirmar `"ok": true`.

Mudar as chaves VAPID invalida as subscrições existentes. A app renova a subscrição da pessoa da próxima vez que for aberta.

## Horário dos avisos

Os crons correm às 09:00, 10:00 e 11:00 UTC. O código envia a partir das 10h em Lisboa, o que funciona na hora de inverno e de verão. As chamadas seguintes só tratam dos envios que falharam ou de crons perdidos, sem repetir o aviso a quem já o recebeu.

No plano Hobby, a Vercel pode executar um cron em qualquer minuto da hora marcada, por isso os crons da Vercel servem apenas de segurança.

### Envio às 10:00 certas

O envio às horas certas vem de um agendador externo. Em [cron-job.org](https://cron-job.org) (gratuito), criar um cron com:

- URL: `https://URL-DA-APP/api/cron/notify?secret=<CRON_SECRET>`
- Horário: todos os dias às 10:00, fuso `Europe/Lisbon`

Os crons da Vercel podem ficar ativos como segurança: quem já recebeu o aviso não o recebe outra vez.

## Diagnóstico

Quando um aviso não chega, abrir `/api/push/health` e ver `lastCron`. O `recentCrons` guarda as últimas 15 execuções, e `byService` separa os resultados por serviço de push (`apple` é iPhone, `google` é Android ou Chrome).

| O que aparece | Significado |
|---|---|
| `lastCron` é `null` ou de um dia anterior | O cron não correu. Ver Settings, Cron Jobs, e os logs de `/api/cron/notify` |
| `subscriptions: 0` | O servidor não tem dispositivos registados |
| `withStarred: 0` | Os dispositivos não têm estrelas registadas no servidor |
| `withJobs: 0` | Nenhum teste com estrela está nos próximos 7 dias |
| `errors` maior que 0 | O serviço de push recusou. `errorStatuses` indica o código; 401 e 403 apontam para as chaves VAPID ou para `VAPID_SUBJECT` |
| `sent` maior que 0 | O serviço de push aceitou o aviso. Se não apareceu, o problema está no dispositivo |
| `byService` sem `apple` | Nenhum iPhone recebeu envio nessa execução |

Para testar o envio automático em produção sem esperar pelas 10h (envia os avisos de hoje a todos os dispositivos):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://URL-DA-APP/api/cron/notify?force=1"
```

## Onde está o quê

| Ficheiro | O que faz |
|---|---|
| `lib/calendar-data.ts` | Lista de testes; editar aqui para mudar datas |
| `lib/subjects.ts` | Lista de UCs |
| `public/sw.js` | Service worker: cache e notificações |
| `app/actions.ts` | Subscrever e desubscrever |
| `lib/push/store.ts` | Dispositivos registados, entregas do dia e últimas execuções do cron |
| `lib/push/notify.ts` | Decide que avisos enviar |
| `lib/push/send.ts` | Envia uma notificação |
| `app/api/cron/notify/[[...slot]]/route.ts` | Endpoint chamado pelos crons |
| `app/api/push/health/route.ts` | Diagnóstico |
| `hooks/usePushNotifications.ts` | Lógica de push no browser |
| `hooks/useStarred.ts` | Testes com estrela |
| `hooks/useEventFilters.ts` | Filtros do calendário |

## iPhone

As notificações exigem iOS 16.4 ou mais recente e a app instalada no ecrã principal, aberta a partir do ícone. A subscrição feita no Safari não serve para a app instalada: os avisos têm de ser ligados dentro da app.

A partir do iOS 18.4, os avisos usam Declarative Web Push: o sistema mostra a notificação mesmo que o service worker falhe.
