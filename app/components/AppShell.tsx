"use client";

import { Suspense } from "react";
import type React from "react";
import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";

import Sidebar from "./side-bar";
import BottomNav from "./bottom-nav";
import { NavProvider } from "./nav-context";
import { ThemeProvider } from "./theme-provider";
import { TopBar } from "./top-bar";
import { Breadcrumbs } from "./Breadcrumbs";
import CommandPalette from "./CommandPalette";
import AvisoSuscripcion from "./AvisoSuscripcion";
import SoporteBanner from "./SoporteBanner";

import { UserProvider } from "@/context/UserContext";

// Estructura de la app según el ancho:
//   < 768 px  (teléfono)  barra superior compacta + barra inferior fija + hoja "Más"
//   768–1023  (tablet)    barra superior + riel lateral de íconos que se expande encima
//   ≥ 1024    (escritorio) barra superior + menú lateral completo
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/recuperar-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/cambiar-password");

  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <UserProvider>
          <NavProvider>
            {/* h-dvh: en el teléfono 100vh incluye la barra del navegador y empuja lo de abajo fuera de pantalla. */}
            <div className="flex h-dvh flex-col bg-background">
              {!isAuthRoute && <TopBar />}
              {!isAuthRoute && <CommandPalette />}
              <div className="flex flex-1 overflow-hidden">
                {!isAuthRoute && <Sidebar />}
                {/* En teléfono se deja sitio para la barra inferior (4rem + safe-area). */}
                <main
                  className={
                    isAuthRoute
                      ? "min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
                      : "min-w-0 flex-1 overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-8"
                  }
                >
                  {!isAuthRoute && <Breadcrumbs />}
                  {!isAuthRoute && <SoporteBanner />}
                  {!isAuthRoute && <AvisoSuscripcion />}
                  {children}
                </main>
              </div>
              {/* useSearchParams (pestaña activa del portal) exige Suspense; sin él Next intentaría prerender y fallaría. */}
              {!isAuthRoute && (
                <Suspense fallback={null}>
                  <BottomNav />
                </Suspense>
              )}
            </div>
          </NavProvider>
        </UserProvider>
      </ThemeProvider>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
}
