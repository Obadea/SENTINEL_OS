import type { Metadata } from "next";
import { Geist, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SENTINEL_OS — Secure the L2 with AI Precision",
  description:
    "AI-powered smart contract auditing for Mantle. Detect vulnerabilities, optimize gas, and deploy with confidence.",
};

import { ClerkProvider, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { GlobalLoader } from "@/components/global-loader";
import { clerkAppearance } from "@/lib/clerk-appearance";

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance} ui={ui}>
      <html
        lang="en"
        className={`${geistSans.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-[#050505]" suppressHydrationWarning>
          <ClerkLoading>
            <GlobalLoader fullScreen />
          </ClerkLoading>
          <ClerkLoaded>
            <Providers>
              {children}
            </Providers>
          </ClerkLoaded>
        </body>
      </html>
    </ClerkProvider>
  );
}


