// Daily reminder cron. Vercel only knows UTC and calls this endpoint at 9:00,
// 10:00 and 11:00 UTC (see vercel.json). Reminders go out from 10:00 Lisbon time.
// Later calls only retry what failed, because Vercel does not repeat failed
// runs and may miss or duplicate a call.
//
// The last path segment (/09, /10, /11) only exists to make three distinct crons.
//
// Manual test (?force=1 ignores the time and the record of delivered reminders):
//   curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/notify?force=1"
import { NextResponse, type NextRequest } from "next/server";
import { lisbonHour, runNotifications, SEND_HOUR } from "@/lib/push/notify";
import { recordCronRun } from "@/lib/push/store";

export async function GET(request: NextRequest) {
  // Vercel sends this secret, so nobody else can trigger the reminders.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    console.error("[cron] request refused:", secret ? "wrong secret" : "CRON_SECRET missing");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const at = new Date().toISOString();
  const path = request.nextUrl.pathname;
  const force = request.nextUrl.searchParams.get("force") === "1";
  const hour = lisbonHour();

  if (!force && hour < SEND_HOUR) {
    const result = { skipped: true, reason: `It is ${hour}:00 in Lisbon; reminders go out at ${SEND_HOUR}:00.` };
    await recordCronRun({ at, path, ...result });
    return NextResponse.json(result);
  }

  try {
    const stats = await runNotifications(new Date(), { force });
    console.log("[cron] reminders:", stats);
    await recordCronRun({ at, path, ...stats });
    return NextResponse.json(stats);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[cron] failed:", err);
    await recordCronRun({ at, path, error });
    return NextResponse.json({ error }, { status: 500 });
  }
}
