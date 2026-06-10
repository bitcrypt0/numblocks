import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/spline-sans-mono/400.css";
import "@fontsource/spline-sans-mono/500.css";
import "@fontsource/spline-sans-mono/700.css";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ToastProvider } from "@/components/Toast";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://numberblocks.example";
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "NumberBlocks — fully on-chain numbered blocks",
    template: "%s — NumberBlocks",
  },
  description:
    "10,000 numbered blocks, fully on-chain, each backed by 1,000 uniBlocks and polished by Ethereum through six transformation stages.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#111217" },
  ],
};

/** Applies the persisted (or OS-preferred) theme before first paint. */
const themeInit = `(function(){try{var t=localStorage.getItem("nb-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {process.env.NEXT_PUBLIC_DEV_INJECTED === "1" ? (
          // Local mainnet-fork rehearsal wallet ONLY - never set in prod.
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script src="/dev-injected.js" />
        ) : null}
        {PLAUSIBLE_DOMAIN ? (
          // Privacy-preserving analytics (no Google, no Facebook, no cookies).
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        ) : null}
      </head>
      <body className="min-h-screen bg-bg font-display text-ink">
        <a
          href="#main"
          className="sr-only z-50 rounded-block bg-brand px-4 py-2 font-bold text-brand-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <ToastProvider>
          <SiteHeader />
          <main id="main" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-10">
            {children}
          </main>
          <SiteFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
