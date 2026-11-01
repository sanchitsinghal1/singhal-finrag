import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Singhal FinRAG — Evidence-grounded equity research",
  description:
    "Singhal FinRAG is a multi-user research workspace that ingests your financial reports and answers your questions with cited, grounded answers — never invented figures. Crafted by Sanchit Singhal.",
  keywords: [
    "Singhal FinRAG", "RAG", "retrieval-augmented generation", "equity research",
    "financial research", "AI finance", "document Q&A", "Sanchit Singhal",
  ],
  authors: [{ name: "Sanchit Singhal" }],
  creator: "Sanchit Singhal",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/logo/og-512.png",
  },
  openGraph: {
    title: "Singhal FinRAG — Evidence-grounded equity research",
    description: "Upload reports, ask questions, get cited answers grounded in your documents.",
    images: ["/logo/og-512.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Singhal FinRAG",
    description: "Evidence-grounded equity research. Crafted by Sanchit Singhal.",
    images: ["/logo/og-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
          <Sonner position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
