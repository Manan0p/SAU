import type { Metadata } from "next";
import { Manrope, Public_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniWell – Campus Healthcare Platform",
  description:
    "Integrated campus healthcare and insurance management system for SAU students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${publicSans.variable} h-full`}>
      <body className="min-h-full bg-[#F7F9FB] text-[#191C1E] antialiased font-sans" suppressHydrationWarning={true}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
