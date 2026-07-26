import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: false,
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  preload: false,
});

import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { NetworkStatus } from "@/components/pwa/network-status";
import { PwaUpdatePrompt } from "@/components/pwa/pwa-update-prompt";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  applicationName: "CardFlow",
  title: {
    default: "CardFlow",
    template: "%s | CardFlow",
  },
  description:
    "Digital record, card management and staff approval system.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CardFlow",
  },
  icons: {
    icon: [
      {
        url: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

import { DialogProvider } from "@/components/ui/DialogProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${sora.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#0B0F19] antialiased">
        <ServiceWorkerRegistration />
        <NetworkStatus />
        <PwaUpdatePrompt />
        <ReactQueryProvider>
          <ToastProvider>
            <DialogProvider>
              <AuthProvider>{children}</AuthProvider>
            </DialogProvider>
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
