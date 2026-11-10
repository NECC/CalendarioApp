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
        <RegisterSW />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
