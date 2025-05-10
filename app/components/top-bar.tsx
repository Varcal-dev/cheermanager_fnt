"use client"

// Añadir el import de User y Link
import { Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Sidebar from "./side-bar"
import Link from "next/link"

export function TopBar() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-16 items-center border-b px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="mr-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h1 className="text-xl font-bold text-purple-600">Gestor Cheer Gym</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/perfil" passHref>
          <Button variant="ghost" size="icon" className="rounded-full" title="Mi Perfil">
            <User className="h-5 w-5" />
          </Button>
        </Link>
        <ModeToggle />
      </div>
    </div>
  )
}
