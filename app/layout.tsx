import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GraceMap - Глобальная христианская платформа взаимопомощи",
  description: "Пространство реального действия, где молитва, деньги, руки и время соединяются через географию.",
};

import { AuthModal } from "@/components/AuthModal";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GlobalErrorBoundary>
          {children}
          <AuthModal />
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
