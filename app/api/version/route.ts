// Versão do deploy atual. Fica fixa no build, por isso cada deploy tem a sua.
export async function GET() {
  return Response.json({ version: process.env.APP_VERSION });
}
