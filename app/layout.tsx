// Base structure of every page: PWA metadata and global components.
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallPrompt } from "@/app/components/InstallPrompt";
import { OfflineBanner } from "@/app/components/OfflineBanner";
import { RegisterSW } from "@/app/components/RegisterSW";

export const metadata: Metadata = {
  title: "NECC Calendar",
  description: "Calendar of LCC tests, submissions and events.",
  manifest: "/manifest.json",
  applicationName: "NECC Calendar",
  // Name and icon when the app is installed on iPhone.
  appleWebApp: {
    capable: true,
    title: "NECCalendar",
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
    <html lang="en">
      <body>
        <RegisterSW />
        <OfflineBanner />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
