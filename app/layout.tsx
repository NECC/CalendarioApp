import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { RegisterSW } from "@/app/components/RegisterSW";
import { OfflineBanner } from "@/app/components/OfflineBanner";
import { InstallPrompt } from "@/app/components/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NECC Calendário",
  description: "Calendário de testes, entregas e eventos de LCC.",
  manifest: "/manifest.json",
  applicationName: "NECC Calendário",
  // iPhone: nome, estilo da barra de estado e ícone quando instalada no ecrã principal.
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

// Cor da barra do browser/sistema (igual ao theme_color do manifest).
export const viewport: Viewport = {
  themeColor: "#008cca",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            try {
              const theme = localStorage.getItem('theme') || 'light';
              document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {}
          `}
        </Script>
      </head>
      <body>
        <RegisterSW />
        <OfflineBanner />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
