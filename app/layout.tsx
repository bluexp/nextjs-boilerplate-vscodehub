import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Footer } from "@/components/ui/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vscodehub.com"),
  title: {
    default: "vscodehub.com - Awesome List",
    template: `%s | vscodehub.com`,
  },
  description:
    "A curated list of awesome developer resources, updated daily from GitHub.",
  openGraph: {
    title: "vscodehub.com - Awesome List",
    description:
      "A curated list of awesome developer resources, updated daily from GitHub.",
    url: "https://vscodehub.com",
    siteName: "vscodehub.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "vscodehub.com - Awesome List",
    description:
      "A curated list of awesome developer resources, updated daily from GitHub.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
