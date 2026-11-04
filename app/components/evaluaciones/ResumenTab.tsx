"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PUNTAJE_MAXIMO, claseNota, type Grupo, type PromedioCriterio } from "@/app/lib/evaluaciones";

export default function ResumenTab({ grupos }: { grupos: Grupo[] }) {
  const [grupoId, setGrupoId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filas, setFilas] = useState<PromedioCriterio[]>([]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (grupoId) params.grupoId = grupoId;
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    api
      .get<PromedioCriterio[]>("/api/evaluaciones/promedios", { params })
      .then((r) => setFilas(r.data))
      .catch((e) => toast.error(getErrorMessage(e, "No se pudo calcular el resumen")));
  }, [grupoId, desde, hasta]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div>
            <Label htmlFor="r-grupo">Grupo</Label>
            <select id="r-grupo" className="h-9 rounded-md border bg-background px-2 text-sm" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
              <option value="">Todo el club</option>
              {grupos.map((g) => (<option key={g.id} value={g.id}>{g.nombre}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="r-desde">Desde</Label>
            <Input id="r-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="r-hasta">Hasta</Label>
            <Input id="r-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {filas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay evaluaciones en este periodo.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Criterio</TableHead>
              <TableHead className="text-right">Promedio</TableHead>
              <TableHead className="text-right">Evaluaciones</TableHead>
              <TableHead className="text-right">Deportistas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => (
              <TableRow key={f.criterioId}>
                <TableCell>{f.categoria}</TableCell>
                <TableCell>{f.criterio}</TableCell>
                <TableCell className={`text-right font-medium ${claseNota(f.promedio)}`}>{f.promedio}/{PUNTAJE_MAXIMO}</TableCell>
                <TableCell className="text-right">{f.evaluaciones}</TableCell>
                <TableCell className="text-right">{f.deportistas}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
