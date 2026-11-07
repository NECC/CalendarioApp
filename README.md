# NECC Calendar

PWA with the calendar of LCC tests, submissions and events, with push notification reminders.

## Features

- Installable on the home screen (Android, iPhone and desktop)
- Works offline, with the last saved dates
- Reminders for starred tests: one a day at 10:00 Lisbon time, from one week before up to the day itself. Starring a test turns reminders on; Filters is only needed to turn them off

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without the Redis variables, subscriptions stay in memory and are lost on restart.

To trigger the cron by hand (`?force=1` ignores the time and the reminders already delivered):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/notify?force=1"
```

## Deploying to Vercel

1. Import the repository on vercel.com.
2. In Storage or Marketplace, create an Upstash Redis database and connect it to the project. This creates `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. In Settings, Environment Variables, add these for the Production environment:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`, with a real contact
   - `CRON_SECRET`
4. Redeploy, because variables only take effect in a new deployment.
5. Open `/api/push/health` and check for `"ok": true`.

Changing the VAPID keys invalidates existing subscriptions. The app renews a person's subscription the next time it is opened.

## Reminder schedule

The crons run at 09:00, 10:00 and 11:00 UTC. The code sends from 10:00 Lisbon time, which works in both winter and summer time. Later calls only handle failed sends or missed crons, without repeating a reminder for anyone who already got it.

On the Hobby plan, Vercel can run a cron at any minute of the scheduled hour, so a reminder can arrive between 10:00 and 10:59.

## Diagnostics

When a reminder does not arrive, open `/api/push/health` and look at `lastCron`:

| What appears | Meaning |
|---|---|
| `lastCron` is `null` or from an earlier day | The cron did not run. Check Settings, Cron Jobs, and the logs for `/api/cron/notify` |
| `subscriptions: 0` | The server has no registered devices |
| `withStarred: 0` | The devices have no stars registered on the server |
| `withJobs: 0` | No starred test is within the next 7 days |
| `errors` above 0 | The push service refused. `errorStatuses` gives the code; 401 and 403 point to the VAPID keys or `VAPID_SUBJECT` |
| `sent` above 0 | The push service accepted the reminder. If it did not appear, the problem is on the device |

To test automatic sending in production without waiting for 10:00 (sends today's reminders to every registered device):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://APP-URL/api/cron/notify?force=1"
```

## Where things are

| File | What it does |
|---|---|
| `lib/calendar-data.ts` | List of tests; change dates here |
| `lib/subjects.ts` | List of subjects |
| `public/sw.js` | Service worker: cache and notifications |
| `app/actions.ts` | Subscribing and unsubscribing |
| `lib/push/store.ts` | Registered devices, today's deliveries and the last cron run |
| `lib/push/notify.ts` | Decides which reminders to send |
| `lib/push/send.ts` | Sends a notification |
| `app/api/cron/notify/[[...slot]]/route.ts` | Endpoint called by the crons |
| `app/api/push/health/route.ts` | Diagnostics |
| `hooks/usePushNotifications.ts` | Push logic in the browser |
| `hooks/useStarred.ts` | Starred tests |
| `hooks/useEventFilters.ts` | Calendar filters |

## iPhone

Notifications require iOS 16.4 or later and the app installed on the home screen, opened from its icon.
