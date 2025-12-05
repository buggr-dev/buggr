import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NotesProvider } from "@/app/context/NotesContext";
import { NotesPanel } from "@/app/components/NotesPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "stresst - Stress Test Your Developers",
  description: "Introduce subtle bugs to test debugging skills",
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
        <NotesProvider>
          {children}
          <NotesPanel />
        </NotesProvider>
      </body>
    </html>
  );
}
