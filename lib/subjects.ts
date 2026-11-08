// Lista de UCs, usada nos filtros. Os nomes são os nomes oficiais das UCs.
export interface Subject {
  name: string;
  code: string;
  /** 0 = eventos gerais */
  year: number;
  semester?: number;
}

export const SUBJECTS_DATA: Subject[] = [
  { name: "Álgebra Linear CC", code: "ALCC", year: 1, semester: 1 },
  { name: "Cálculo", code: "Cálculo", year: 1, semester: 1 },
  { name: "Programação Funcional", code: "PF", year: 1, semester: 1 },
  {
    name: "Tópicos Fundamentais de Matemática",
    code: "TFM",
    year: 1,
    semester: 1,
  },
  { name: "Laboratório de Programação I", code: "LP-I", year: 1, semester: 1 },
  { name: "Análise Matemática", code: "AM", year: 1, semester: 2 },
  {
    name: "Laboratório de Programação II",
    code: "LP-II",
    year: 1,
    semester: 2,
  },
  { name: "Matemática Discreta", code: "MD", year: 1, semester: 2 },
  { name: "Programação Imperativa", code: "PI", year: 1, semester: 2 },
  { name: "Sistemas de Computação", code: "SC", year: 1, semester: 2 },
  { name: "Álgebra", code: "Álgebra", year: 2, semester: 1 },
  { name: "Algoritmos e Complexidade", code: "AeC", year: 2, semester: 1 },
  { name: "Análise Numérica", code: "AN", year: 2, semester: 1 },
  { name: "Lógica CC", code: "Lógica CC", year: 2, semester: 1 },
  {
    name: "Sistema de Comunicação e Redes",
    code: "SCR",
    year: 2,
    semester: 1,
  },
  { name: "Teoria de Categorias", code: "TC", year: 2, semester: 2 },
  {
    name: "Autómatos e Linguagens Formais",
    code: "ALF",
    year: 2,
    semester: 2,
  },
  { name: "Bases de Dados", code: "BD", year: 2, semester: 2 },
  {
    name: "Programação Orientada aos Objetos",
    code: "POO",
    year: 2,
    semester: 2,
  },
  { name: "Sistemas Operativos", code: "SO", year: 2, semester: 2 },
  { name: "Probabilidades Aplicadas", code: "PA", year: 2, semester: 2 },
  {
    name: "Aprendizagem Estatística CC",
    code: "Estatística",
    year: 3,
    semester: 1,
  },
  { name: "Computabilidade e Complexidade", code: "CC", year: 3, semester: 1 },
  { name: "Lógica Computacional", code: "LC", year: 3, semester: 1 },
  {
    name: "Processamento de Linguagens e Compiladores",
    code: "PLC",
    year: 3,
    semester: 1,
  },
  {
    name: "Teoria de Números Computacional",
    code: "TNC",
    year: 3,
    semester: 1,
  },
  { name: "Cálculo de Programas", code: "CP", year: 3, semester: 1 },
  { name: "Computação Gráfica", code: "CG", year: 3, semester: 2 },
  { name: "Aprendizagem Computacional", code: "AC", year: 3, semester: 2 },
  { name: "Programação Concorrente", code: "PC", year: 3, semester: 2 },
  {
    name: "Semântica das Linguagens de Programação",
    code: "SLP",
    year: 3,
    semester: 2,
  },
  { name: "Geometria", code: "Geometria", year: 3, semester: 2 },
  {
    name: "Fundamentos de Criptografia e Segurança da Informação CC",
    code: "Criptografia",
    year: 3,
    semester: 2,
  },
  { name: "Otimização", code: "Otimização", year: 3, semester: 2 },
  { name: "40 Anos LCC", code: "40 LCC", year: 0 },
  { name: "Linux Installation Party", code: "LIP", year: 0 },
  { name: "A Festa dos 50 Anos", code: "50DI", year: 0 },
];

/** Ano de cada categoria de evento (0 = eventos gerais). */
export const EVENT_CATEGORY_YEAR: Record<string, number> = {
  ano1: 1,
  ano2: 2,
  ano3: 3,
  eventos: 0,
};

