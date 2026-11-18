// Estrutura base de todas as páginas: metadados da PWA e componentes globais.
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/app/components/RegisterSW";
import { Haptics } from "@/app/components/Haptics";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "NECC Calendário · Testes e entregas de LCC (UMinho)",
  description: SITE_DESCRIPTION,
  keywords: [
    "NECC",
    "calendário",
    "testes",
    "entregas",
    "LCC",
    "Ciências da Computação",
    "Universidade do Minho",
    "UMinho",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: "/icons/necc-icon-512.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/icons/necc-icon-512.png"],
  },
  // Código do Google Search Console (opcional), para confirmar que o site é nosso.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
  manifest: "/manifest.json",
  applicationName: SITE_NAME,
  // Nome e ícone quando a app está instalada no iPhone.
  appleWebApp: {
    capable: true,
    title: "NECCalendário",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/necc-icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon-180.png", sizes: "180x180" }],
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
            Não pode ter pointer-events-none: o iOS decide pelo elemento que recebe o toque.
            Tem de ter mais de 10px; no iOS 26.1 a safe area do topo pode ser 0, daí o mínimo
            de 12px, que cabe no espaço de 1rem acima da barra de topo. */}
        <div aria-hidden="true" className="fixed top-0 inset-x-0 z-30 h-[max(12px,env(safe-area-inset-top))] bg-background" />
        <RegisterSW />
        <Haptics />
        {children}
      </body>
    </html>
  );
}
