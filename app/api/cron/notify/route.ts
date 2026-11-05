// =============================================================
// Crons das notificações (ver vercel.json → "crons").
//   /api/cron/notify?slot=morning  → de manhã: testes com ⭐ que são hoje
//   /api/cron/notify?slot=evening  → ao fim do dia: ⭐ 1–5 dias antes +
//                                    véspera/semana dos restantes
//
// Quando a variável CRON_SECRET existe, a Vercel envia automaticamente
// o header "Authorization: Bearer <CRON_SECRET>" — assim ninguém de fora
// consegue disparar notificações a toda a gente.
//
// Para testar à mão em local:
//   curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/notify?slot=evening"
// =============================================================
import { NextResponse, type NextRequest } from "next/server";
import { runNotifications } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slot = request.nextUrl.searchParams.get("slot") === "morning" ? "morning" : "evening";
  const stats = await runNotifications(slot);
  console.log("[cron] notificações:", stats);
  return NextResponse.json(stats);
}
