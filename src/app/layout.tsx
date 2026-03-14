import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "CarbonFarm – Farmer Carbon Credit Aggregation",
  description: "Check eligibility, join pools, and track plantation dMRV for Verra VM0047 carbon credits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans antialiased bg-background text-foreground`}>
        <SessionProvider>
          {children}
          <Toaster richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
