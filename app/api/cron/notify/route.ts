// =============================================================
// Cron diário dos avisos (ver vercel.json → "crons").
//
// Queremos enviar às 10h de LISBOA, mas a Vercel só conhece UTC, e Lisboa
// muda de hora no verão (10h Lisboa = 10h UTC no inverno, 9h UTC no verão).
// Por isso a Vercel chama este URL às 9h e às 10h UTC, e só enviamos na
// chamada em que são 10h em Lisboa. A outra não faz nada.
//
// Quando a variável CRON_SECRET existe, a Vercel envia automaticamente
// o header "Authorization: Bearer <CRON_SECRET>" — assim ninguém de fora
// consegue disparar notificações a toda a gente.
//
// Para testar à mão (o ?force=1 ignora a verificação da hora):
//   curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/notify?force=1"
// =============================================================
import { NextResponse, type NextRequest } from "next/server";
import { lisbonHour, runNotifications, SEND_HOUR } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";
  const hour = lisbonHour();
  if (!force && hour !== SEND_HOUR) {
    return NextResponse.json({ skipped: true, reason: `São ${hour}h em Lisboa, só enviamos às ${SEND_HOUR}h` });
  }

  const stats = await runNotifications();
  console.log("[cron] notificações:", stats);
  return NextResponse.json(stats);
}
