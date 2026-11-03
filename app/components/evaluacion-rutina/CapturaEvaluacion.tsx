"use client";

import { Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SECCIONES, type GrupoOpcion } from "@/app/lib/evaluacion-rutina";
import { ETIQUETA_SECCION } from "./comunes";
import DeduccionesForm from "./DeduccionesForm";
import GuiaHabilidades from "./GuiaHabilidades";
import SubCriterioFormRow from "./SubCriterioFormRow";
import type { CapturaEvaluacion as Captura } from "./useCapturaEvaluacion";

interface Props {
  captura: Captura;
  grupos: GrupoOpcion[];
}

export default function CapturaEvaluacion({ captura, grupos }: Props) {
  const { niveles, contexto, cambiarContexto, registros, actualizarRegistro, subCriteriosPorSeccion, topesNivel } = captura;
  // Solo se muestran las secciones que el nivel elegido puntúa (p. ej. Novice no tiene Construcciones ni Gimnasia).
  const seccionesDelNivel = SECCIONES.filter((s) => (subCriteriosPorSeccion[s] || []).length > 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>1. Contexto de la evaluación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Grupo</Label>
            <Select value={contexto.grupoId} onValueChange={(v) => cambiarContexto({ grupoId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nivel de competencia</Label>
            <Select value={contexto.nivelId} onValueChange={(v) => cambiarContexto({ nivelId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un nivel" />
              </SelectTrigger>
              <SelectContent>
                {niveles.map((n) => (
                  <SelectItem key={n.id} value={String(n.id)}>
                    {n.nombre} ({n.modalidad})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cantidad de atletas</Label>
            <Input
              type="number"
              min={1}
              value={contexto.cantidadAtletas}
              onChange={(e) => cambiarContexto({ cantidadAtletas: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={contexto.fecha} onChange={(e) => cambiarContexto({ fecha: e.target.value })} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Evento</Label>
            <Input
              placeholder="Ej. Práctica interna, Nacional FEDECOLCHEER 2026…"
              value={contexto.evento}
              onChange={(e) => cambiarContexto({ evento: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 md:col-span-3">
            <Label>Observaciones (opcional)</Label>
            <Textarea value={contexto.observaciones} onChange={(e) => cambiarContexto({ observaciones: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {captura.cargandoCatalogos ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando la rúbrica…
        </div>
      ) : !captura.contextoCompleto ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Completa el contexto de arriba para habilitar la captura por sección.
        </p>
      ) : captura.cargandoNivel || !topesNivel ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando la rúbrica del nivel…
        </div>
      ) : seccionesDelNivel.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Este nivel todavía no tiene la rúbrica configurada, así que no se puede evaluar.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>2. Captura por sección</CardTitle>
            <CardDescription>Ingresa lo que tengas anotado en la hoja del juez</CardDescription>
            <div className="pt-2">
              <GuiaHabilidades nivel={niveles.find((n) => String(n.id) === contexto.nivelId)} />
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={seccionesDelNivel}>
              {seccionesDelNivel.map((seccion) => (
                <AccordionItem key={seccion} value={seccion}>
                  <AccordionTrigger>{ETIQUETA_SECCION[seccion]}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {(subCriteriosPorSeccion[seccion] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay sub-criterios configurados en esta sección.</p>
                    ) : (
                      subCriteriosPorSeccion[seccion].map((sc) => (
                        <SubCriterioFormRow
                          key={sc.id}
                          subCriterio={sc}
                          nivelId={Number(contexto.nivelId)}
                          topesNivel={topesNivel}
                          valor={registros[sc.id]}
                          onChange={(patch) => actualizarRegistro(sc.id, patch)}
                        />
                      ))
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {captura.admiteDeducciones && (
              <div className="mt-6 space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">Deducciones y seguridad</h4>
                <p className="text-xs text-muted-foreground">
                  Se restan en puntos sobre la escala de 100 (por ejemplo, 3 caídas × 0.15 = −0.45).
                </p>
                <DeduccionesForm deducciones={captura.deducciones} onChange={captura.setDeducciones} />
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={captura.revisar} disabled={captura.previsualizando}>
                {captura.previsualizando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Revisar cálculo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
