import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Akshat Ghee Hisaab",
    template: "%s | Akshat Ghee Hisaab",
  },
  description:
    "Professional digital ledger management system for Akshat Ghee — Track customers, sales, payments and outstanding balances.",
  keywords: ["ghee", "hisaab", "khata", "ledger", "accounting", "business"],
  authors: [{ name: "Akshat Ghee" }],
  creator: "Akshat Ghee",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "Akshat Ghee Hisaab",
    description: "Professional digital ledger management system",
    siteName: "Akshat Ghee Hisaab",
  },
  robots: {
    index: false, // private business app
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('wheel', function(e) {
                if (e.target && e.target.type === 'number') {
                  e.target.blur();
                }
              }, { passive: false });
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#F8FAFC', color: '#0F172A' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
