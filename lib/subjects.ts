export interface Subject {
  name: string;
  sigla: string;
  /** 0 = eventos gerais */
  year: number;
  semester?: number;
}

export const SUBJECTS_DATA: Subject[] = [
  { name: "Álgebra Linear CC", sigla: "ALCC", year: 1, semester: 1 },
  { name: "Cálculo", sigla: "Cálculo", year: 1, semester: 1 },
  { name: "Programação Funcional", sigla: "PF", year: 1, semester: 1 },
  {
    name: "Tópicos Fundamentais de Matemática",
    sigla: "TFM",
    year: 1,
    semester: 1,
  },
  { name: "Laboratório de Programação I", sigla: "LP-I", year: 1, semester: 1 },
  { name: "Análise Matemática", sigla: "AM", year: 1, semester: 2 },
  {
    name: "Laboratório de Programação II",
    sigla: "LP-II",
    year: 1,
    semester: 2,
  },
  { name: "Matemática Discreta", sigla: "MD", year: 1, semester: 2 },
  { name: "Programação Imperativa", sigla: "PI", year: 1, semester: 2 },
  { name: "Sistemas de Computação", sigla: "SC", year: 1, semester: 2 },
  { name: "Álgebra", sigla: "Álgebra", year: 2, semester: 1 },
  { name: "Algoritmos e Complexidade", sigla: "AeC", year: 2, semester: 1 },
  { name: "Análise Numérica", sigla: "AN", year: 2, semester: 1 },
  { name: "Lógica CC", sigla: "Lógica CC", year: 2, semester: 1 },
  {
    name: "Sistema de Comunicação e Redes",
    sigla: "SCR",
    year: 2,
    semester: 1,
  },
  { name: "Teoria de Categorias", sigla: "TC", year: 2, semester: 2 },
  {
    name: "Autómatos e Linguagens Formais",
    sigla: "ALF",
    year: 2,
    semester: 2,
  },
  { name: "Bases de Dados", sigla: "BD", year: 2, semester: 2 },
  {
    name: "Programação Orientada aos Objetos",
    sigla: "POO",
    year: 2,
    semester: 2,
  },
  { name: "Sistemas Operativos", sigla: "SO", year: 2, semester: 2 },
  { name: "Probabilidades Aplicadas", sigla: "PA", year: 2, semester: 2 },
  {
    name: "Aprendizagem Estatística CC",
    sigla: "Estatística",
    year: 3,
    semester: 1,
  },
  { name: "Computabilidade e Complexidade", sigla: "CC", year: 3, semester: 1 },
  { name: "Lógica Computacional", sigla: "LC", year: 3, semester: 1 },
  {
    name: "Processamento de Linguagens e Compiladores",
    sigla: "PLC",
    year: 3,
    semester: 1,
  },
  {
    name: "Teoria de Números Computacional",
    sigla: "TNC",
    year: 3,
    semester: 1,
  },
  { name: "Cálculo de Programas", sigla: "CP", year: 3, semester: 1 },
  { name: "Computação Gráfica", sigla: "CG", year: 3, semester: 2 },
  { name: "Aprendizagem Computacional", sigla: "AC", year: 3, semester: 2 },
  { name: "Programação Concorrente", sigla: "PC", year: 3, semester: 2 },
  {
    name: "Semântica das Linguagens de Programação",
    sigla: "SLP",
    year: 3,
    semester: 2,
  },
  { name: "Geometria", sigla: "Geometria", year: 3, semester: 2 },
  {
    name: "Fundamentos de Criptografia e Segurança da Informação CC",
    sigla: "Criptografia",
    year: 3,
    semester: 2,
  },
  { name: "Otimização", sigla: "Otimização", year: 3, semester: 2 },
  { name: "40 Anos LCC", sigla: "40 LCC", year: 0 },
  { name: "Linux Installation Party", sigla: "LIP", year: 0 },
  { name: "A Festa dos 50 Anos", sigla: "50DI", year: 0 },
];

/** Categoria do evento -> ano (0 = eventos gerais). */
export const EVENT_CATEGORY_YEAR: Record<string, number> = {
  ano1: 1,
  ano2: 2,
  ano3: 3,
  eventos: 0,
};

export type YearFilter = number | "all";
