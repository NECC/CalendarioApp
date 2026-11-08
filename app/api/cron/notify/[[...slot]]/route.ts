// Cron diário dos avisos. A Vercel só conhece UTC e chama este endpoint às 9:00,
// 10:00 e 11:00 UTC (ver vercel.json). Os avisos saem a partir das 10h em Lisboa.
// As chamadas seguintes só repetem o que falhou, porque a Vercel não repete
// execuções falhadas e pode perder ou duplicar uma chamada.
//
// O último segmento do caminho (/09, /10, /11) só serve para criar três crons distintos.
//
// Teste manual (?force=1 ignora a hora e o registo dos avisos já entregues):
//   curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/notify?force=1"
import { NextResponse, type NextRequest } from "next/server";
import { lisbonHour, runNotifications, SEND_HOUR } from "@/lib/push/notify";
import { recordCronRun } from "@/lib/push/store";

/**
 * Devolve o motivo da recusa, ou null se o pedido for válido.
 * A Vercel envia "Authorization: Bearer". O agendador externo envia ?secret= no URL,
 * porque os headers configurados no cron-job.org não chegavam ao servidor.
 */
function refusalReason(request: NextRequest): string | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return "falta CRON_SECRET no servidor";

  const authorization = request.headers.get("authorization");
  const urlSecret = request.nextUrl.searchParams.get("secret");
  if (authorization === `Bearer ${secret}` || urlSecret === secret) return null;
  return authorization || urlSecret ? "segredo errado" : "pedido sem segredo";
}

export async function GET(request: NextRequest) {
  const refusal = refusalReason(request);
  if (refusal) {
    console.error("[cron] pedido recusado:", refusal);
    return NextResponse.json({ error: "Não autorizado", reason: refusal }, { status: 401 });
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
