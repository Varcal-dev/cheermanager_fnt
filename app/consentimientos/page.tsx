"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, getErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Deportistas sin consentimiento vigente (Ley 1581). Sirve para saber a quién falta cargarle la autorización
// antes de activar CONSENTIMIENTOS_EXIGIR_SALUD en el back. El registro se hace en Deportistas →
// (fila) → "Acudientes y consentimientos".

interface Pendiente {
  deportistaId: number;
  personaId: number;
  nombre: string;
  numeroDocumento?: string;
}

const TIPOS = [
  { valor: "DATOS_SALUD", etiqueta: "Datos de salud" },
  { valor: "TRATAMIENTO_DATOS", etiqueta: "Tratamiento de datos" },
  { valor: "IMAGEN", etiqueta: "Uso de imagen" },
];

export default function ConsentimientosPage() {
  const [tipo, setTipo] = useState("DATOS_SALUD");
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api
      .get("/api/consentimientos/pendientes", { params: { tipo } })
      .then((res) => setPendientes(res.data ?? []))
      .catch((error) => toast.error(getErrorMessage(error, "No se pudo cargar la lista")))
      .finally(() => setCargando(false));
  }, [tipo]);

  return (
    <ProtectedRoute requiredPermission="ver_consentimientos">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consentimientos pendientes</h1>
          <p className="text-muted-foreground">
            Deportistas que aún no tienen un consentimiento vigente del tipo seleccionado. Para registrarlo, abre al
            deportista en Personas → Deportistas y entra a la pestaña "Acudientes y consentimientos".
          </p>
        </div>

        <Tabs value={tipo} onValueChange={setTipo}>
          <TabsList>
            {TIPOS.map((t) => (
              <TabsTrigger key={t.valor} value={t.valor}>
                {t.etiqueta}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deportista</TableHead>
                  <TableHead>Documento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : pendientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Sin pendientes para este tipo de consentimiento.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendientes.map((p) => (
                    <TableRow key={p.deportistaId}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell>{p.numeroDocumento || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {!cargando && pendientes.length > 0 && (
          <p className="text-sm text-muted-foreground">{pendientes.length} pendientes.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
