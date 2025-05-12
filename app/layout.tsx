import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"; // <-- Importa el Toaster

import Sidebar from "./components/side-bar";
import { ThemeProvider } from "./components/theme-provider";
import { TopBar } from "./components/top-bar";

import { UserProvider } from "@/context/UserContext"; // <--- Importa UserProvider
import ProtectedRoute from "@/components/ProtectedRoute"; // <--- Importa ProtectedRoute si lo usas aquí

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cheer Manager",
  description:
    "Cheer Manager: Sistema avanzado de gestión para gimnasios de cheerleading, organiza clases, horarios y atletas de manera eficiente.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Envuelve la parte principal con UserProvider */}
          <UserProvider>
            <div className="flex h-screen bg-background flex-col">
              <TopBar />
              <div className="flex flex-1 overflow-hidden">
                <div className="hidden md:block">
                  <Sidebar />
                </div>
                <main className="flex-1 overflow-y-auto p-8">{children}</main>
              </div>
            </div>
          </UserProvider>
          <Toaster />
        </ThemeProvider>
        
      </body>
    </html>
  );
}
