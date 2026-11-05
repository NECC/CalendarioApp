// =============================================================
// Cron diário das notificações.
// A Vercel chama este URL sozinha todos os dias (ver vercel.json → "crons").
// Quando a variável CRON_SECRET existe, a Vercel envia automaticamente
// o header "Authorization: Bearer <CRON_SECRET>" — assim ninguém de fora
// consegue disparar notificações a toda a gente.
//
// Para testar à mão em local:
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/notify
// =============================================================
import { NextResponse, type NextRequest } from "next/server";
import { runDailyNotifications } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await runDailyNotifications();
  console.log("[cron] notificações:", stats);
  return NextResponse.json(stats);
}
