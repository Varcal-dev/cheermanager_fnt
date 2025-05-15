"use client";

// Añadir el import de User y Link
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./side-bar";
import Link from "next/link";

// Importar los componentes necesarios
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";


export function TopBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Realiza la petición POST al endpoint de logout de tu backend
      const response = await axios.post(
        "http://localhost:8080/api/logout",
        {},
        {
          withCredentials: true, // Importante si usas cookies de sesión
        }
      );

      if (response.status === 200) {
        // Si el backend responde exitosamente, la sesión se cerró
        console.log("Sesión cerrada exitosamente");
        setUsuario(null); // Aquí puedes limpiar el estado del usuario si lo tienes en un contexto o estado global
        router.push('/login'); // Reemplaza '/login' con la ruta de tu página de inicio de sesión

        // También podrías limpiar cualquier estado local o contexto de usuario si los tienes
        setUsuario(null); // Por ejemplo, si tienes un estado de usuario en un contexto
      } else {
        // Manejar si el backend devuelve un código de estado diferente (aunque 200 es lo esperado para éxito)
        console.error("Error al cerrar sesión:", response.statusText);
      }
    } catch (error: any) {
      // Manejar errores de la petición (ej. error de red, servidor caído)
      console.error("Error en la petición de cierre de sesión:", error);
      router.push('/login');
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
function setUsuario(arg0: null) {
  throw new Error("Function not implemented.");
}

