"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NivelesPantalla from "@/app/components/niveles/NivelesPantalla";
import DivisionesPantalla from "@/app/components/divisiones/DivisionesPantalla";
import { CategoriasView } from "@/app/components/categorias-nivel/categorias-view";

// Niveles, divisiones y categorías por nivel (el cruce de ambos) en una sola pantalla.
// /niveles, /divisiones y /categorias-nivel redirigen aquí con la pestaña correspondiente.
const TABS = ["niveles", "divisiones", "categorias"] as const;
type Tab = (typeof TABS)[number];

function Contenido() {
  const router = useRouter();
  const params = useSearchParams();
  const pedida = params.get("tab") as Tab | null;
  const tab: Tab = pedida && TABS.includes(pedida) ? pedida : "niveles";

  return (
    <ProtectedRoute requiredPermission="ver_dash_organizacion">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Niveles y categorías</h1>
          <p className="text-muted-foreground">Estructura deportiva del club: niveles, divisiones y el cruce de ambos.</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => router.replace(`/estructura-deportiva?tab=${v}`, { scroll: false })}>
          <TabsList>
            <TabsTrigger value="niveles">Niveles</TabsTrigger>
            <TabsTrigger value="divisiones">Divisiones</TabsTrigger>
            <TabsTrigger value="categorias">Categorías por nivel</TabsTrigger>
          </TabsList>
          <TabsContent value="niveles" className="pt-4">
            <NivelesPantalla />
          </TabsContent>
          <TabsContent value="divisiones" className="pt-4">
            <DivisionesPantalla embebido />
          </TabsContent>
          <TabsContent value="categorias" className="pt-4">
            <CategoriasView />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

export default function EstructuraDeportivaPage() {
  return (
    <Suspense fallback={null}>
      <Contenido />
    </Suspense>
  );
}
