"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getErrorMessage } from "@/lib/api";
import PreinscripcionForm, { type DeportistaPreinscrito } from "@/app/components/deportistas/PreinscripcionForm";
import type { Genero, Nivel } from "@/app/deportistas/types";

// Pre-inscribir = registrar al deportista (sus datos). La matrícula (plan de pago y grupo) es el paso siguiente
// y se hace en /inscripciones: desde aquí se puede continuar de una vez con "Matricular ahora".
export default function PreinscribirPage() {
  const router = useRouter();
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [registrado, setRegistrado] = useState<DeportistaPreinscrito | null>(null);

  useEffect(() => {
    Promise.all([api.get("/api/niveles"), api.get("/api/usuario/genero/listar")])
      .then(([n, g]) => {
        setNiveles(n.data);
        setGeneros(g.data);
      })
      .catch((error) => toast.error(getErrorMessage(error, "No se pudieron cargar niveles y géneros.")));
  }, []);

  const matricularAhora = () => {
    if (!registrado || registrado.id === null) return;
    router.push(
      `/inscripciones?matricular=${registrado.id}&nombre=${encodeURIComponent(
        registrado.nombreCompleto,
      )}&nivel=${encodeURIComponent(registrado.nivelNombre)}`,
    );
  };

  return (
    <ProtectedRoute requiredPermission="crear_deportista">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Pre-inscribir</h1>
          <p className="text-muted-foreground">
            Registra los datos del deportista. Después podrás matricularlo (plan de pago y grupo).
          </p>
        </div>

        {registrado ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {registrado.nombreCompleto} quedó pre-inscrito
              </CardTitle>
              <CardDescription>
                Aún no tiene plan de pago ni grupo. Matricúlalo ahora o hazlo más tarde desde Inscripciones.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {registrado.id !== null && <Button onClick={matricularAhora}>Matricular ahora</Button>}
              <Button variant="outline" onClick={() => setRegistrado(null)}>
                Pre-inscribir a otro
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/deportistas">Ver deportistas</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Datos del deportista</CardTitle>
              <CardDescription>Nombre, apellidos, documento, fecha de nacimiento, género y nivel son obligatorios.</CardDescription>
            </CardHeader>
            <CardContent>
              <PreinscripcionForm
                niveles={niveles}
                generos={generos}
                textoBoton="Pre-inscribir"
                onGuardado={setRegistrado}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}