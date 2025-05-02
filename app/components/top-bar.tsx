"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Sidebar from "./side-bar"

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
      <ModeToggle />
    </div>
  )
}
