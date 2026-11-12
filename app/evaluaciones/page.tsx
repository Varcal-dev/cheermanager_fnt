"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarCriterios, listarGrupos, type Criterio, type Grupo } from "@/app/lib/evaluaciones";
import EvaluarTab from "@/app/components/evaluaciones/EvaluarTab";
import HistorialTab from "@/app/components/evaluaciones/HistorialTab";
import ProgresionTab from "@/app/components/evaluaciones/ProgresionTab";
import ResumenTab from "@/app/components/evaluaciones/ResumenTab";
import TryoutTab from "@/app/components/evaluaciones/TryoutTab";

// Evaluación técnica por criterio (escala 0–10). La evaluación de rutinas (rúbrica FEDECOLCHEER) está en /evaluacion-rutina.
function Contenido() {
  const { permissions } = useUser();
  const puedeCrear = permissions.includes("crear_evaluacion");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [criterios, setCriterios] = useState<Criterio[]>([]);

  const recargarCriterios = () => listarCriterios().then(setCriterios).catch(() => undefined);

  useEffect(() => {
    Promise.all([listarGrupos(), listarCriterios()])
      .then(([g, c]) => {
        setGrupos(g);
        setCriterios(c);
      })
      .catch(() => toast.error("No se pudieron cargar los grupos y criterios"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Evaluaciones</h1>
        <p className="text-muted-foreground">
          Evaluación técnica por criterio (0 a 10): historial, captura por grupo o por deportista, progresión y resumen.
        </p>
      </div>
      <Tabs defaultValue="historial">
        <TabsList className="flex-wrap">
          <TabsTrigger value="historial">Historial</TabsTrigger>
          {puedeCrear && <TabsTrigger value="evaluar">Evaluar</TabsTrigger>}
          <TabsTrigger value="tryout">Tryout</TabsTrigger>
          <TabsTrigger value="progresion">Progresión</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
        </TabsList>
        <TabsContent value="historial" className="pt-4"><HistorialTab grupos={grupos} criterios={criterios} /></TabsContent>
        {puedeCrear && <TabsContent value="evaluar" className="pt-4"><EvaluarTab grupos={grupos} criterios={criterios} /></TabsContent>}
        <TabsContent value="tryout" className="pt-4"><TryoutTab grupos={grupos} criterios={criterios} onCriteriosCambian={recargarCriterios} /></TabsContent>
        <TabsContent value="progresion" className="pt-4"><ProgresionTab grupos={grupos} criterios={criterios} /></TabsContent>
        <TabsContent value="resumen" className="pt-4"><ResumenTab grupos={grupos} /></TabsContent>
      </Tabs>
    </div>
  );
}

export default function EvaluacionesPage() {
  return (
    <ProtectedRoute requiredPermission="ver_evaluacion">
      <Contenido />
    </ProtectedRoute>
  );
}
