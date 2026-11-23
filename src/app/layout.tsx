import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UMS — University Management System",
    template: "%s · UMS",
  },
  description:
    "University Management System — enrollment, attendance, exams, results, transcripts, and Stripe tuition payments for students, instructors, and administrators.",
  applicationName: "UMS",
  keywords: ["university", "student portal", "enrollment", "transcript", "tuition", "LMS"],
  openGraph: {
    type: "website",
    siteName: "UMS",
    title: "UMS — University Management System",
    description: "A modern university portal for students, instructors, and administrators.",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "UMS — University Management System",
    description: "A modern university portal for students, instructors, and administrators.",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
