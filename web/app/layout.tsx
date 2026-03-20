import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "pinkysbrain — Play against living neurons",
  description:
    "A browser-based platform where humans play classic games against real neural recordings from biological computers. Built on the Cortical Labs CL SDK.",
  openGraph: {
    title: "pinkysbrain — Play against living neurons",
    description:
      "Play games against 800,000 lab-grown human neurons. Watch them think in real time.",
    url: "https://pinkysbrain.xyz",
    siteName: "pinkysbrain",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "pinkysbrain — Play against living neurons",
    description:
      "Play games against 800,000 lab-grown human neurons. Watch them think in real time.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050508] text-[#e0e0e8]">
        {children}
      </body>
    </html>
  );
}
