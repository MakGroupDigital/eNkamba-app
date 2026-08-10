import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PendingPaymentWatcher } from "@/components/wallet/pending-payment-watcher";
import { GlobalCallOverlay } from "@/components/chat/global-call-overlay";
import { CurrencyInitializer } from "@/components/currency/CurrencyInitializer";
import { GlobalAutoTranslator } from "@/components/translation/GlobalAutoTranslator";
import { UserPinAccessGate } from "@/components/security/UserPinAccessGate";
import { AdminTelemetryAgent } from "@/components/admin/admin-telemetry-agent";
import { AppSplashScreen } from "@/components/app-splash-screen";
import { AppServiceWorkerRegistrar } from "@/components/app-service-worker-registrar";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://enkamba.app"),
  title: "eNkamba - La vie simplifiée et meilleure",
  description:
    "Écosystème digital tout-en-un : finance, e-commerce, logistique, messagerie et réseau social.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "eNkamba - La vie simplifiée et meilleure",
    description:
      "Écosystème digital tout-en-un : finance, e-commerce, logistique, messagerie et réseau social.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 512,
        height: 512,
        alt: "Logo eNkamba",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "eNkamba - La vie simplifiée et meilleure",
    description:
      "Écosystème digital tout-en-un : finance, e-commerce, logistique, messagerie et réseau social.",
    images: ["/og-image.png"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#009058" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Roboto:wght@400&family=Fira+Code&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppSplashScreen />
          <AppServiceWorkerRegistrar />
          <CurrencyInitializer />
          <UserPinAccessGate>
            <GlobalAutoTranslator />
            <AdminTelemetryAgent />
            {children}
            <GlobalCallOverlay />
            <PendingPaymentWatcher />
          </UserPinAccessGate>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>

  );
}
