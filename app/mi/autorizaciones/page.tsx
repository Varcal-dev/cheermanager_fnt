"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  portalAutorizaciones,
  portalFirmarAutorizaciones,
  type AutorizacionItem,
  type TipoAutorizacion,
} from "@/app/lib/autorizaciones";

// Enlace público al texto completo de las autorizaciones (sección 4 del documento legal, ver .env.example).
const URL_AUTORIZACION = process.env.NEXT_PUBLIC_URL_AUTORIZACION ?? "";

const ETIQUETA: Record<TipoAutorizacion, string> = {
  TRATAMIENTO_DATOS: "Autorizo el tratamiento de los datos personales del deportista (obligatoria).",
  DATOS_SALUD: "Autorizo el tratamiento de sus datos de salud (historial médico, lesiones, alergias).",
  IMAGEN: "Autorizo el uso de fotos y videos del deportista en redes y publicidad del club (opcional).",
};

function TarjetaDeportista({ item, onFirmado }: { item: AutorizacionItem; onFirmado: () => void }) {
  const vigente = (t: TipoAutorizacion) => item.tipos.find((x) => x.tipo === t)?.vigente ?? false;
  const [tratamiento, setTratamiento] = useState(vigente("TRATAMIENTO_DATOS"));
  const [salud, setSalud] = useState(vigente("DATOS_SALUD"));
  const [imagen, setImagen] = useState(vigente("IMAGEN"));
  const [enviando, setEnviando] = useState(false);

  const completo = vigente("TRATAMIENTO_DATOS") && vigente("DATOS_SALUD") && vigente("IMAGEN");
  const hayCambios =
    (tratamiento && !vigente("TRATAMIENTO_DATOS")) ||
    (salud && !vigente("DATOS_SALUD")) ||
    (imagen && !vigente("IMAGEN"));
  const enlaceListo = URL_AUTORIZACION !== "";

  const firmar = async () => {
    setEnviando(true);
    try {
      await portalFirmarAutorizaciones(item.deportistaId, { tratamiento, salud, imagen });
      toast.success("Autorización registrada");
      onFirmado();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo registrar la autorización"));
    } finally {
      setEnviando(false);
    }
  };

  const casilla = (tipo: TipoAutorizacion, valor: boolean, set: (v: boolean) => void) => (
    <div className="flex items-start gap-3">
      <Checkbox
        id={`${item.deportistaId}-${tipo}`}
        checked={valor}
        onCheckedChange={(v) => set(v === true)}
        // Lo ya autorizado queda marcado y fijo: revocar se pide al club.
        disabled={enviando || vigente(tipo) || !item.puedeFirmar || !enlaceListo}
      />
      <Label htmlFor={`${item.deportistaId}-${tipo}`} className="leading-snug font-normal">
        {ETIQUETA[tipo]}
        {vigente(tipo) && (
          <Badge variant="secondary" className="ml-2">
            Firmada
          </Badge>
        )}
      </Label>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{item.nombre}</CardTitle>
        <CardDescription>
          {item.menor ? "Menor de edad: autoriza su acudiente." : "Mayor de edad."} Versión del texto {item.version}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!item.puedeFirmar && item.motivoNoPuede && (
          <Alert className="text-sm py-2">
            <AlertDescription>{item.motivoNoPuede}</AlertDescription>
          </Alert>
        )}
        {casilla("TRATAMIENTO_DATOS", tratamiento, setTratamiento)}
        {casilla("DATOS_SALUD", salud, setSalud)}
        {casilla("IMAGEN", imagen, setImagen)}
      </CardContent>
      <CardFooter>
        <Button
          onClick={firmar}
          disabled={enviando || completo || !hayCambios || !item.puedeFirmar || !enlaceListo || !tratamiento}
        >
          {enviando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
          {completo ? "Todo autorizado" : "Firmar autorización"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function Contenido() {
  const [items, setItems] = useState<AutorizacionItem[] | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    portalAutorizaciones()
      .then(setItems)
      .catch((e) => setError(getErrorMessage(e, "No se pudieron cargar las autorizaciones")));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Button asChild variant="ghost" size="sm">
        <Link href="/mi">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al portal
        </Link>
      </Button>
      <h1 className="text-2xl font-bold">Autorizaciones de datos personales</h1>
      <p className="text-sm text-muted-foreground">
        Al firmar, quedan registrados la fecha, la versión del texto y quién autorizó. Puedes pedirle al club que
        revoque una autorización en cualquier momento.
      </p>
      {URL_AUTORIZACION ? (
        <p className="text-sm">
          Lee el texto completo:{" "}
          <a href={URL_AUTORIZACION} target="_blank" rel="noopener noreferrer" className="underline text-primary">
            Autorización de tratamiento de datos
          </a>
        </p>
      ) : (
        <Alert className="text-sm py-2">
          <AlertDescription>
            El texto de la autorización aún no está publicado (falta NEXT_PUBLIC_URL_AUTORIZACION). No se puede firmar
            sin poder leerlo.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {items === null && !error && <Loader2 className="h-5 w-5 animate-spin" />}
      {items?.length === 0 && <p className="text-sm text-muted-foreground">No hay deportistas asociados a tu cuenta.</p>}
      {items?.map((i) => <TarjetaDeportista key={i.deportistaId} item={i} onFirmado={cargar} />)}
    </div>
  );
}

export default function AutorizacionesPage() {
  return (
    <ProtectedRoute requiredPermission="acceder_portal">
      <Contenido />
    </ProtectedRoute>
  );
}
