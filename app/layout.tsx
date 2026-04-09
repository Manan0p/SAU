import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniWell – Campus Healthcare Platform",
  description:
    "Integrated campus healthcare and insurance management system for SAU students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased font-sans" suppressHydrationWarning={true}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
