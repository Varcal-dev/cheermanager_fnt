"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NivelCompetencia } from "@/app/lib/evaluacion-rutina";

type NivelHabilidades = 1 | 2 | 3 | 4;

/**
 * Guía oficial de habilidades FEDECOLCHEER N1–N4 (2026), páginas tal cual el PDF para no arriesgar transcripción.
 * Elevaciones y Gimnasia; los lanzamientos de N2 vienen en la misma página que las elevaciones.
 */
export function nivelDeHabilidades(nivel: Pick<NivelCompetencia, "nombre" | "modalidad">): NivelHabilidades | null {
  const nombre = nivel.nombre.trim();
  if (nivel.modalidad === "Novice") return 1; // Novice compite con habilidades N1
  const m = nombre.match(/(\d)(?:\.\d+)?\s*$/); // "Elite 4.2" → 4, "Prep 2.1" → 2
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 4 ? (n as NivelHabilidades) : null;
}

export default function GuiaHabilidades({ nivel }: { nivel: NivelCompetencia | undefined }) {
  const [abierto, setAbierto] = useState(false);
  if (!nivel) return null;
  const n = nivelDeHabilidades(nivel);
  if (!n) return null;

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          Guía de habilidades N{n}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Habilidades Nivel {n}</DialogTitle>
          <DialogDescription>
            Guía oficial FEDECOLCHEER 2026 para {nivel.nombre}. Cada viñeta cuenta como una habilidad diferente.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="elevaciones">
          <TabsList>
            <TabsTrigger value="elevaciones">Elevaciones{n === 2 ? " y lanzamientos" : ""}</TabsTrigger>
            <TabsTrigger value="gimnasia">Gimnasia</TabsTrigger>
          </TabsList>
          {(["elevaciones", "gimnasia"] as const).map((tipo) => (
            <TabsContent key={tipo} value={tipo}>
              <a href={`/habilidades/n${n}-${tipo}.webp`} target="_blank" rel="noreferrer" title="Abrir a tamaño completo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/habilidades/n${n}-${tipo}.webp`}
                  alt={`Habilidades de ${tipo} nivel ${n}`}
                  className="w-full h-auto rounded-md border bg-white"
                  loading="lazy"
                />
              </a>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
