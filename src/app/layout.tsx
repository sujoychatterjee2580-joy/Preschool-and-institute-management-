import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "KiddieSync AI - Preschool & Tuition Center Manager",
  description: "Simple & Powerful Preschool & Tuition Center Management with WhatsApp Automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen bg-slate-50 text-slate-900 flex antialiased selection:bg-indigo-500 selection:text-white">
        <LanguageProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Header />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">{children}</main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
