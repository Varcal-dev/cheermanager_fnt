
"use client";
import type React from "react";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import Sidebar from "./components/side-bar";
import { ThemeProvider } from "./components/theme-provider";
import { TopBar } from "./components/top-bar";
import { Breadcrumbs } from "./components/Breadcrumbs";
import CommandPalette from "./components/CommandPalette";
import AvisoSuscripcion from "./components/AvisoSuscripcion";

import { UserProvider } from "@/context/UserContext";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/recuperar-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/cambiar-password");

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <div className="flex h-screen bg-background flex-col">
              {!isAuthRoute && <TopBar />}
              {!isAuthRoute && <CommandPalette />}
              <div className="flex flex-1 overflow-hidden">
                {!isAuthRoute && (
                  <div className="hidden md:block">
                    <Sidebar />
                  </div>
                )}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                  {!isAuthRoute && <Breadcrumbs />}
                  {!isAuthRoute && <AvisoSuscripcion />}
                  {children}
                </main>
              </div>
            </div>
          </UserProvider>
        </ThemeProvider>
        <ToastContainer position="top-right" autoClose={5000} />
      </body>
    </html>
  );
}
