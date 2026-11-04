import { NextResponse } from "next/server";

export async function GET() {
  // Podes alterar estes dados ou ligar mais tarde à tua base de dados real
  const categories = [
    { id: "ano1", name: "1º Ano", color: "#3B82F6" },
    { id: "ano2", name: "2º Ano", color: "#10B981" },
    { id: "ano3", name: "3º Ano", color: "#8B5CF6" },
    { id: "eventos", name: "Eventos", color: "#111827" },
  ];

  const events = [
    {
      id: "1",
      title: "Lógica CC - Teste",
      description: "Teste prático de laboratório",
      startTimestampnz: "2026-11-02T10:00:00",
      endTimestampnz: "2026-11-02T12:00:00",
      category: "ano1",
    },
  ];

  return NextResponse.json({ categories, events });
}