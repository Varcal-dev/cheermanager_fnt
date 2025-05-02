import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Sidebar from "./components/side-bar"
import { ThemeProvider } from "./components/theme-provider"
import { TopBar } from "./components/top-bar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gestor Cheer Gym",
  description: "Sistema de gestión para gimnasio de cheerleading",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="flex h-screen bg-background flex-col">
            <TopBar />
            <div className="flex flex-1 overflow-hidden">
              <div className="hidden md:block">
                <Sidebar />
              </div>
              <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
