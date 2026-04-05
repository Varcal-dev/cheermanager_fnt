"use client";

// Añadir el import de User y Link
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./side-bar";
import Link from "next/link";
import { useUser } from "@/context/UserContext" // Asegúrate de importar correctamente el hook


// Importar los componentes necesarios
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, clearAuthToken } from "@/lib/api";
import { toast } from "react-toastify";


export function TopBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { setUser } = useUser()

  const handleLogout = async () => {
    try {
      const response = await api.post("/api/logout", {});

      if (response.status === 200) {
        console.log("Sesión cerrada exitosamente");
        clearAuthToken();
        setUser(null);
        router.push('/login');
      } else {
        console.error("Error al cerrar sesión:", response.statusText);
        toast.error("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
      }
    } catch (error: any) {
      console.error("Error en la petición de cierre de sesión:", error);
      toast.error("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h1 className="text-xl font-semibold">Cheer Manager</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/perfil" passHref>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            title="Mi Perfil"
          >
            <User className="h-5 w-5" />
          </Button>
        </Link>
        <ModeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}


