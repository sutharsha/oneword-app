import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "OneWord — Say one word.",
    template: "%s | OneWord",
  },
  description: "A social feed where you can only say one word. Answer the daily prompt with a single word and react to others.",
  keywords: ["social", "one word", "daily prompt", "feed", "reactions"],
  authors: [{ name: "OneWord" }],
  openGraph: {
    title: "OneWord — Say one word.",
    description: "A social feed where you can only say one word.",
    type: "website",
    siteName: "OneWord",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "OneWord — Say one word.",
    description: "A social feed where you can only say one word.",
  },
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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
