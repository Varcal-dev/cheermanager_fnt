"use client";

import { useState } from "react";
import { Loader2, ShieldOff } from "lucide-react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PALABRA = "ANONIMIZAR";

/**
 * L7: supresión de datos personales (derecho del titular). IRREVERSIBLE. Solo para deportistas Retirados y con el
 * permiso anonimizar_titular. Se conservan facturas y pagos; se borran los datos que identifican a la persona.
 */
export default function AnonimizarTitularButton({
  personaId,
  nombre,
  onHecho,
}: {
  personaId: number;
  nombre: string;
  onHecho?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  const valido = motivo.trim().length >= 5 && confirmacion.trim() === PALABRA;

  const anonimizar = async () => {
    setEnviando(true);
    try {
      const { data } = await api.post(`/api/personas/${personaId}/anonimizar`, { motivo, confirmacion });
      toast.success(
        `Datos anonimizados (${data.registrosMedicosEliminados} registros médicos eliminados, ` +
          `${data.acudientesAnonimizados} acudiente(s) anonimizado(s)).`,
      );
      setAbierto(false);
      setMotivo("");
      setConfirmacion("");
      onHecho?.();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo anonimizar"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setAbierto(true)}>
        <ShieldOff className="h-4 w-4 mr-2" /> Anonimizar datos
      </Button>
      <Dialog open={abierto} onOpenChange={(o) => !enviando && setAbierto(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anonimizar a {nombre}</DialogTitle>
            <DialogDescription>
              Se reemplazan sus datos personales (nombre, documento, contacto, dirección), se borra su historial médico
              y se desactiva su acceso. Las facturas y pagos se conservan sin identificar a la persona.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive" className="text-sm py-2">
            <AlertDescription>
              Esta acción es <strong>irreversible</strong>. Antes, entrega la copia de sus datos si el titular la pidió.
              Los acudientes vinculados solo a este deportista también se anonimizan.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="motivo-anon">Motivo (p. ej. número de la solicitud del titular)</Label>
            <Input id="motivo-anon" value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={enviando} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conf-anon">
              Escribe <strong>{PALABRA}</strong> para confirmar
            </Label>
            <Input
              id="conf-anon"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              disabled={enviando}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={anonimizar} disabled={!valido || enviando}>
              {enviando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Anonimizar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
