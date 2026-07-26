"use client";
import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import Sidebar from "./components/side-bar";
import { ThemeProvider } from "./components/theme-provider";
import { TopBar } from "./components/top-bar";
import { Breadcrumbs } from "./components/Breadcrumbs";

import { UserProvider } from "@/context/UserContext";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <div className="flex h-screen bg-background flex-col">
              {!isAuthRoute && <TopBar />}
              <div className="flex flex-1 overflow-hidden">
                {!isAuthRoute && (
                  <div className="hidden md:block">
                    <Sidebar />
                  </div>
                )}
                <main className="flex-1 overflow-y-auto p-8">
                  {!isAuthRoute && <Breadcrumbs />}
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