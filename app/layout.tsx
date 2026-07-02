import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CardFlow – Organization Portal",
  description: "CardFlow Organization Staff & Admin Portal",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { DialogProvider } from "@/components/ui/DialogProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";

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
        <ToastProvider>
          <DialogProvider>
            <AuthProvider>{children}</AuthProvider>
          </DialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
