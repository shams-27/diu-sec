import type { Metadata } from "next";
import { Bebas_Neue, Geist_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "DIU SEC — Software Engineering Club", template: "%s | DIU SEC" },
  description:
    "Daffodil International University Software Engineering Club — wings, events, projects and opportunities for SWE students.",
  openGraph: {
    title: "DIU SEC — Software Engineering Club",
    description: "Build, compete and grow with the DIU Software Engineering Club.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${sourceSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
