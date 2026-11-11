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
  title: "Whats the Time",
  description:
    "See your BYU Pathway Religion class time in your own time zone, including daylight saving changes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="bg-zinc-100 px-4 py-4 text-center text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          &copy; 2026 Christina Dobbins. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
