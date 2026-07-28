import type { Metadata } from "next";
import { Poppins, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nexthire.cloud"),
  title: "NextHire | AI-Powered Premium Global Job Portal",
  description:
    "Connecting exceptional talent with world-class tech companies through intelligent, skill-first matching.",
  keywords: [
    "AI Job Portal",
    "Tech Recruitment SaaS",
    "Skill Matching Engine",
    "Developer Hiring",
    "Remote Tech Jobs",
    "NextHire Cloud",
  ],
  authors: [{ name: "NextHire Technologies", url: "https://www.nexthire.cloud" }],
  openGraph: {
    title: "NextHire | AI-Powered Premium Global Job Portal",
    description: "Find your next career breakthrough with AI-verified skill matching.",
    url: "https://www.nexthire.cloud",
    siteName: "NextHire Cloud",
    images: [
      {
        url: "/nexthire_primary_logo.png",
        width: 1200,
        height: 630,
        alt: "NextHire AI Portal",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextHire | AI-Powered Premium Global Job Portal",
    description: "Find your next career breakthrough with AI-verified skill matching.",
    images: ["/nexthire_primary_logo.png"],
  },
};

import { AICopilotDrawer } from "@/components/ui/AICopilotDrawer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${poppins.variable} ${hanken.variable} antialiased min-h-screen flex flex-col bg-surface text-on-surface`}
      >
        <AuthProvider>
          <ToastProvider>
            {children}
            <AICopilotDrawer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
