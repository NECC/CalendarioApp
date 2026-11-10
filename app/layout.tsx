// Estrutura base de todas as páginas: metadados da PWA e componentes globais.
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallPrompt } from "@/app/components/InstallPrompt";
import { RegisterSW } from "@/app/components/RegisterSW";

export const metadata: Metadata = {
  title: "NECC Calendário",
  description: "Calendário de testes, entregas e eventos de LCC.",
  manifest: "/manifest.json",
  applicationName: "NECC Calendário",
  // Nome e ícone quando a app está instalada no iPhone.
  appleWebApp: {
    capable: true,
    title: "NECCalendário",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/necc-icon.svg", type: "image/svg+xml" },
      { url: "/icons/necc-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/necc-icon-192.png", sizes: "192x192" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#008cca",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>
        {/* O iOS 26 desfoca o topo das apps instaladas, por cima dos botões. Não o faz
            quando o topo do ecrã é uma faixa fixa, da largura toda e de cor sólida.
            Não pode ter pointer-events-none: o iOS decide pelo elemento que recebe o toque. */}
        <div aria-hidden="true" className="fixed top-0 inset-x-0 z-30 h-[env(safe-area-inset-top)] bg-background" />
        <RegisterSW />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
