// Endereço público do site, usado nos metadados para os motores de pesquisa
// (sitemap, robots.txt, link canónico e pré-visualizações ao partilhar).
// Pode mudar-se com NEXT_PUBLIC_SITE_URL (por exemplo, ao passar para um domínio próprio).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://calendario-app-blond-nine.vercel.app")
).replace(/\/$/, "");

export const SITE_NAME = "NECC Calendário";
export const SITE_DESCRIPTION =
  "Calendário de testes, entregas e apresentações de Ciências da Computação (LCC) da Universidade do Minho, feito pelo NECC. Filtra pelas tuas UCs e recebe avisos antes dos testes.";
