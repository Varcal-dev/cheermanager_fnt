"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Calendar,
  Award,
  BarChart3,
  ShoppingBag,
  DollarSign,
  Shield,
  Settings,
  ChevronDown,
  UserPlus,
  Layers,
  ClipboardList,
  Trophy,
  Target,
  FileText,
  ShoppingCart,
  CreditCard,
  Lock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { useUser } from "@/context/UserContext";

const Sidebar = () => {
  
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (path: string) => {
    return pathname === path;
  };
  const { permissions } = useUser();
  return (
    <aside className="w-64 border-r bg-card h-screen overflow-y-auto">
      <nav className="px-3 py-2">
        <div className="space-y-1">
          <Link href="/" passHref>
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Home className="mr-2 h-4 w-4" />
              Inicio
            </Button>
          </Link>

          {/* Personas */}
          {permissions.includes("ver_dash_personas") && (
            <Collapsible
              open={openSections.includes("personas")}
              onOpenChange={() => toggleSection("personas")}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Personas</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <Link href="/deportistas" passHref>
                  <Button
                    variant={isActive("/deportistas") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Deportistas
                  </Button>
                </Link>
                <Link href="/entrenadores" passHref>
                  <Button
                    variant={isActive("/entrenadores") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Entrenadores
                  </Button>
                </Link>{/*
                <Link href="/historial-medico" passHref>
                  <Button
                    variant={
                      isActive("/historial-medico") ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Historial Médico
                  </Button>
                </Link>*/}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Organización Deportiva */}
          {permissions.includes("ver_dash_organizacion") && (
            <Collapsible
              open={openSections.includes("organizacion")}
              onOpenChange={() => toggleSection("organizacion")}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Layers className="mr-2 h-4 w-4" />
                    <span>Organización</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <Link href="/niveles" passHref>
                  <Button
                    variant={isActive("/niveles") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Niveles
                  </Button>
                </Link>
                <Link href="/divisiones" passHref>
                  <Button
                    variant={isActive("/divisiones") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Divisiones
                  </Button>
                </Link>
                {/*
                <Link href="/categorias-nivel" passHref>
                  <Button
                    variant={
                      isActive("/categorias-nivel") ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Categorias por Nivel
                  </Button>
                </Link>*/}
                <Link href="/grupos" passHref>
                  <Button
                    variant={isActive("/grupos") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Grupos
                  </Button>
                </Link>
                <Link href="/inscripciones" passHref>
                  <Button
                    variant={isActive("/inscripciones") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Inscripciones
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Horarios */}
          {permissions.includes("ver_dash_horarios") && (
            <Collapsible
              open={openSections.includes("horarios")}
              onOpenChange={() => toggleSection("horarios")}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Horarios</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <Link href="/horarios" passHref>
                  <Button
                    variant={isActive("/horarios") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Gestión de Horarios
                  </Button>
                </Link>
                <Link href="/asistencias" passHref>
                  <Button
                    variant={isActive("/asistencias") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Asistencias
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Eventos */}
          {permissions.includes("ver_dash_eventos") && (
            <Collapsible
              open={openSections.includes("eventos")}
              onOpenChange={() => toggleSection("eventos")}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>Eventos</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <Link href="/eventos" passHref>
                  <Button
                    variant={isActive("/eventos") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Competencias y Eventos
                  </Button>
                </Link>
                <Link href="/premios" passHref>
                  <Button
                    variant={isActive("/premios") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Premios
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Evaluación */}
          {permissions.includes("ver_dash_evaluacion") && (
            <Collapsible
              open={openSections.includes("evaluacion")}
              onOpenChange={() => toggleSection("evaluacion")}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Evaluación</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <Link href="/criterios-evaluacion" passHref>
                  <Button
                    variant={
                      isActive("/criterios-evaluacion") ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Criterios
                  </Button>
                </Link>
                <Link href="/evaluaciones" passHref>
                  <Button
                    variant={isActive("/evaluaciones") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Evaluaciones
                  </Button>
                </Link>
                <Link href="/objetivos" passHref>
                  <Button
                    variant={isActive("/objetivos") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Objetivos
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Tienda */}
          {permissions.includes("ver_dash_tienda") && (
            <Collapsible
              open={openSections.includes("tienda")}
              onOpenChange={() => toggleSection("tienda")}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>Tienda</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <Link href="/productos" passHref>
                  <Button
                    variant={isActive("/productos") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Productos
                  </Button>
                </Link>
                <Link href="/inventario" passHref>
                  <Button
                    variant={isActive("/inventario") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Inventario
                  </Button>
                </Link>
                <Link href="/ventas" passHref>
                  <Button
                    variant={isActive("/ventas") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Ventas
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Finanzas */}
          {permissions.includes("ver_dash_finanzas") && (
            <Collapsible
              open={openSections.includes("finanzas")}
              onOpenChange={() => toggleSection("finanzas")}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Finanzas</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <Link href="/planes-pago" passHref>
                  <Button
                    variant={isActive("/planes-pago") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Planes de Pago
                  </Button>
                </Link>
                <Link href="/descuentos" passHref>
                  <Button
                    variant={isActive("/descuentos") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Descuentos
                  </Button>
                </Link>
                <Link href="/convenios" passHref>
                  <Button
                    variant={isActive("/convenios") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Convenios
                  </Button>
                </Link>
                <Link href="/facturas" passHref>
                  <Button
                    variant={isActive("/facturas") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Facturas
                  </Button>
                </Link>
                <Link href="/pagos" passHref>
                  <Button
                    variant={isActive("/pagos") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pagos
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Administración */}
          {permissions.includes("ver_dash_administracion") && (
            <Collapsible
              open={openSections.includes("admin")}
              onOpenChange={() => toggleSection("admin")}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Administración</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <Link href="/usuarios" passHref>
                  <Button
                    variant={isActive("/usuarios") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Usuarios
                  </Button>
                </Link>
                <Link href="/roles" passHref>
                  <Button
                    variant={isActive("/roles") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Roles y Permisos
                  </Button>
                </Link>
                <Link href="/auditoria" passHref>
                  <Button
                    variant={isActive("/auditoria") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Auditoría
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
