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
  title: "Cyber-Industrial Auditor",
  description: "High-stakes smart contract auditing with enterprise-grade precision.",
};

import { ClerkProvider, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { GlobalLoader } from "@/components/global-loader";

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,

        variables: {

          colorPrimary: "#a1d800",
          colorBackground: "#050505",
          colorText: "#e5e2e1",
          colorInputBackground: "#0a0a0a",
          colorInputText: "#ffffff",
          colorTextSecondary: "#8d9479",
          colorTextOnPrimaryBackground: "#000000",
          borderRadius: "0px",
          fontFamily: "var(--font-jetbrains-mono)",
        },
        elements: {
          card: "bg-[#050505] border border-wireframe shadow-none rounded-none text-[#e5e2e1]",
          navbar: "bg-[#0a0a0a] border-r border-wireframe",
          navbarTitle: {
            color: "#a1d800 !important",
            fontFamily: "var(--font-jetbrains-mono)",
            textTransform: "uppercase",
            fontWeight: "bold",
            letterSpacing: "0.05em"
          },
          navbarSectionTitle: {
            color: "#a1d800 !important",
            fontFamily: "var(--font-jetbrains-mono)",
            textTransform: "uppercase",
            fontWeight: "bold"
          },
          profileSectionTitle: {
            color: "#a1d800 !important"
          },
          profilePageTitle: {
            color: "#a1d800 !important"
          },
          navbarSubtitle: {
            color: "#e5e2e1 !important",
            fontSize: "11px"
          },
          navbarSectionSubtitle: {
            color: "#e5e2e1 !important",
            fontSize: "11px"
          },
          profileSectionSubtitle: {
            color: "#e5e2e1 !important"
          },
          profilePageSubtitle: {
            color: "#e5e2e1 !important"
          },
          navbarButton: "text-[#e5e2e1] hover:text-neon-green transition-colors",
          navbarButtonText: {
            color: "#e5e2e1 !important",
            fontFamily: "var(--font-jetbrains-mono)",
            textTransform: "uppercase",
            fontSize: "10px"
          },
          headerTitle: "text-neon-green uppercase tracking-tighter font-bold",
          headerSubtitle: {
            color: "#8d9479 !important",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          },
          socialButtonsBlockButton: "border border-wireframe hover:bg-white/5 rounded-none text-[#e5e2e1]",
          socialButtonsBlockButtonText: "font-mono uppercase text-[10px] tracking-widest text-[#e5e2e1]",
          formButtonPrimary: "bg-neon-green hover:bg-neon-green/90 text-black font-bold uppercase tracking-widest rounded-none shadow-none",
          formFieldLabel: "text-[#8d9479] uppercase text-[9px] tracking-widest font-bold",
          formFieldInput: "bg-[#0a0a0a] border border-[#1a1a1a] rounded-none text-white focus:border-neon-green focus:ring-0 transition-all",
          footer: {
            color: "#8d9479 !important",
            opacity: "0.6",
            fontSize: "9px",
            fontFamily: "var(--font-jetbrains-mono)",
            textTransform: "uppercase"
          },
          footerActionText: {
            color: "#8d9479 !important"
          },
          footerActionLink: {
            color: "#a1d800 !important",
            fontWeight: "bold"
          },
          identityPreviewText: "text-neon-green",
          identityPreviewEditButtonIcon: "text-neon-green",
          userButtonPopoverCard: "bg-[#050505] border border-wireframe shadow-none rounded-none",
          userButtonPopoverActionButton: {
            color: "#e5e2e1 !important",
            "&:hover": {
              color: "#a1d800 !important",
              backgroundColor: "rgba(161, 216, 0, 0.05) !important"
            }
          },
          userButtonPopoverActionButtonText: {
            color: "#e5e2e1 !important",
            fontFamily: "var(--font-jetbrains-mono)",
            textTransform: "uppercase",
            fontSize: "10px",
            letterSpacing: "0.1em"
          },
          userButtonPopoverActionButtonIcon: "text-neon-green",
          userPreviewMainIdentifier: {
            color: "#e5e2e1 !important",
            fontWeight: "bold"
          },
          userPreviewSecondaryIdentifier: {
            color: "#8d9479 !important",
            fontSize: "10px"
          },
          userButtonPopoverActionButton__manageAccount: {
            color: "#e5e2e1 !important"
          },
          userButtonPopoverActionButton__signOut: {
            color: "#e5e2e1 !important"
          },
        }
      }}
    >
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


