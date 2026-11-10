// Recebe as estrelas enviadas pelo service worker, que não pode chamar server actions.
import { updateStarred } from "@/app/actions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await updateStarred(body?.endpoint, body?.starred);
  return Response.json(result, { status: result.success ? 200 : 404 });
}
