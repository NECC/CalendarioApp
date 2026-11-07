// Cron diário dos avisos. A Vercel só conhece UTC e chama este endpoint às
// 9h, 10h e 11h UTC (ver vercel.json); enviamos a partir das 10h em Lisboa.
// As chamadas seguintes recuperam só o que falhou, porque a Vercel não repete
// execuções falhadas e pode falhar ou duplicar uma chamada.
//
// O segmento final (/09, /10, /11) serve apenas para ter três crons distintos.
//
// Teste manual (?force=1 ignora a hora e o registo de avisos já entregues):
//   curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/notify?force=1"
import { NextResponse, type NextRequest } from "next/server";
import { lisbonHour, runNotifications, SEND_HOUR } from "@/lib/notify";
import { recordCronRun } from "@/lib/push-store";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    console.error("[cron] pedido recusado:", secret ? "segredo errado" : "CRON_SECRET em falta");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const at = new Date().toISOString();
  const path = request.nextUrl.pathname;
  const force = request.nextUrl.searchParams.get("force") === "1";
  const hour = lisbonHour();

  if (!force && hour < SEND_HOUR) {
    const result = { skipped: true, reason: `São ${hour}h em Lisboa; os avisos saem às ${SEND_HOUR}h.` };
    await recordCronRun({ at, path, ...result });
    return NextResponse.json(result);
  }

  try {
    const stats = await runNotifications(new Date(), { force });
    console.log("[cron] avisos:", stats);
    await recordCronRun({ at, path, ...stats });
    return NextResponse.json(stats);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[cron] falhou:", err);
    await recordCronRun({ at, path, error });
    return NextResponse.json({ error }, { status: 500 });
  }
}
