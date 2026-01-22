import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { NotesProvider } from "@/app/context/NotesContext";
import { Providers } from "@/app/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buggr.dev";

export const metadata: Metadata = {
  title: "Buggr - Bugger Up Your Code",
  description: "A debugging game for developers. We inject realistic bugs into any codebase — you find and fix them. Test if you're a Vibe Coder or a Jive Coder.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Buggr - Bugger Up Your Code",
    description: "A debugging game for developers. We inject realistic bugs into any codebase — you find and fix them. Are you a Vibe Coder or a Jive Coder?",
    url: siteUrl,
    siteName: "Buggr",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Buggr - A debugging game for developers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buggr - Bugger Up Your Code",
    description: "A debugging game for developers. We inject realistic bugs into any codebase — you find and fix them.",
    images: ["/og-image.png"],
  },
  keywords: ["debugging", "developer tools", "coding game", "bug fixing", "programming practice", "GitHub"],
  authors: [{ name: "Buggr" }],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>
          <Providers>
            <NotesProvider>
              {children}
            </NotesProvider>
          </Providers>
        </NuqsAdapter>
        <Analytics />
      </body>
    </html>
  );
}
