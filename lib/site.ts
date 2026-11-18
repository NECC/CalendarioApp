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

/** Repositório do NECC com o material das UCs, aberto a partir do calendário no computador. */
const MATERIAL_URL = "https://github.com/NECC/Material-Do-Curso";

// Pasta de cada UC no repositório (pela sigla, o `code` em lib/subjects.ts). Os nomes
// têm de ser iguais aos do GitHub, mesmo quando diferem do nome oficial da UC.
const MATERIAL_FOLDERS: Record<string, string> = {
  ALCC: "1º ano/Álgebra Linear",
  Cálculo: "1º ano/Cálculo",
  PF: "1º ano/Programação Funcional",
  TFM: "1º ano/Tópicos Fundamentais de Matemática",
  "LP-I": "1º ano/Laboratórios de Programação I",
  AM: "1º ano/Análise Matemática",
  "LP-II": "1º ano/Laboratórios de Programação II",
  MD: "1º ano/Matemática Discreta",
  PI: "1º ano/Programação Imperativa",
  SC: "1º ano/Sistemas de Computação",
  Álgebra: "2º ano/Álgebra",
  AeC: "2º ano/Algoritmos e Complexidade",
  AN: "2º ano/Análise Numérica",
  "Lógica CC": "2º ano/Lógica",
  SCR: "2º ano/Sistemas de Comunicação e Redes",
  TC: "2º ano/Teoria de Categorias",
  ALF: "2º ano/Autómatos e Linguagens Formais",
  BD: "2º ano/Bases de Dados",
  POO: "2º ano/Programação Orientada aos Objetos",
  SO: "2º ano/Sistemas Operativos",
  PA: "2º ano/Probabilidades Aplicada",
  // O nome da pasta no GitHub acaba com um espaço.
  Estatística: "3º ano/Aprendizagem Estatística ",
  CC: "3º ano/Computabilidade e Complexidade",
  LC: "3º ano/Lógica Computacional",
  PLC: "3º ano/Processamento de Linguagens e Compiladores",
  TNC: "3º ano/Teoria de Números Computacional",
  CP: "3º ano/Cálculo de Programas",
  CG: "3º ano/Computação Gráfica",
  AC: "3º ano/Aprendizagem Computacional",
  PC: "3º ano/Programação Concorrente",
  SLP: "3º ano/Semântica das Linguagens de Programação",
  Geometria: "3º ano/Geometria",
  Criptografia: "3º ano/Fundamentos de Criptografia e Segurança da Informação",
  Otimização: "3º ano/Otimização",
};

/** Pasta do material da UC do evento; sem pasta conhecida, a do ano, ou o repositório todo. */
export function materialUrl(event: { subject?: string; category: string }): string {
  const year = event.category.match(/^ano(\d)$/)?.[1];
  const folder = (event.subject && MATERIAL_FOLDERS[event.subject]) ?? (year && `${year}º ano`);
  if (!folder) return MATERIAL_URL;
  return `${MATERIAL_URL}/tree/main/${folder.split("/").map(encodeURIComponent).join("/")}`;
}
