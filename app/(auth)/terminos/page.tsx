"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/context/UserContext";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Enlaces públicos a los documentos vigentes (se configuran en el front, ver .env.example).
const URL_TERMINOS = process.env.NEXT_PUBLIC_URL_TERMINOS ?? "";
const URL_POLITICA = process.env.NEXT_PUBLIC_URL_POLITICA ?? "";

interface DocumentoEstado {
  tipo: "TERMINOS" | "POLITICA";
  version: string;
  aceptado: boolean;
}

/**
 * Aceptación de Términos y Condiciones y Política de Tratamiento de Datos por el club (L1).
 * Solo la ve quien tiene el permiso aceptar_terminos (Administrador). Queda registrado quién, cuándo,
 * desde qué IP y qué versión se aceptó.
 */
export default function TerminosPage() {
  const router = useRouter();
  const { user, permissions, loading: userLoading, refreshUser, legalPendiente } = useUser();

  const [docs, setDocs] = useState<DocumentoEstado[]>([]);
  const [terminos, setTerminos] = useState(false);
  const [politica, setPolitica] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const puedeAceptar = permissions.includes("aceptar_terminos");

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    // Sin permiso, o ya al día: no hay nada que hacer aquí.
    if (!puedeAceptar || !legalPendiente) {
      router.push("/");
    }
  }, [userLoading, user, puedeAceptar, legalPendiente, router]);

  useEffect(() => {
    if (!user || !puedeAceptar) return;
    api
      .get("/api/legal/estado")
      .then((r) => setDocs(r.data?.documentos ?? []))
      .catch(() => setDocs([]));
  }, [user, puedeAceptar]);

  const version = (tipo: string) => docs.find((d) => d.tipo === tipo)?.version ?? "";
  const enlacesListos = URL_TERMINOS !== "" && URL_POLITICA !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/legal/aceptar", { terminos, politica });
      await refreshUser();
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar la aceptación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-600 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-2 items-center text-center">
          <CardTitle className="text-2xl font-bold text-primary">Términos y datos personales</CardTitle>
          <CardDescription>
            Para usar CheerManager, el administrador del club debe aceptar los siguientes documentos en nombre del
            club. Queda registrado quién acepta, cuándo y qué versión.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="text-sm py-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!enlacesListos && (
              <Alert className="text-sm py-2">
                <AlertDescription>
                  Los documentos aún no están publicados en esta instalación (faltan NEXT_PUBLIC_URL_TERMINOS y
                  NEXT_PUBLIC_URL_POLITICA). No se puede aceptar sin poder leerlos.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-start gap-3">
              <Checkbox
                id="terminos"
                checked={terminos}
                onCheckedChange={(v) => setTerminos(v === true)}
                disabled={loading || !enlacesListos}
              />
              <Label htmlFor="terminos" className="leading-snug font-normal">
                He leído y acepto los{" "}
                <a
                  href={URL_TERMINOS || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  Términos y Condiciones del servicio
                </a>{" "}
                {version("TERMINOS") && <span className="text-muted-foreground">(versión {version("TERMINOS")})</span>}
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="politica"
                checked={politica}
                onCheckedChange={(v) => setPolitica(v === true)}
                disabled={loading || !enlacesListos}
              />
              <Label htmlFor="politica" className="leading-snug font-normal">
                He leído y acepto la{" "}
                <a
                  href={URL_POLITICA || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  Política de Tratamiento de Datos Personales
                </a>{" "}
                {version("POLITICA") && <span className="text-muted-foreground">(versión {version("POLITICA")})</span>}
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !terminos || !politica || !enlacesListos}>
              <FileText size={18} className="mr-2" />
              {loading ? "Registrando..." : "Aceptar y continuar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
