import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Loader,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import axios from "axios";

interface Deportista {
  id: number;
  nombre: string;
  apellido: string;
  genero: string;
  nivel: string;
}

export default function DeportistaElegibleItem({
  deportista,
  grupoId,
  onSuccess,
}: {
  deportista: Deportista;
  grupoId: number;
  onSuccess: () => void;
}) {
  //const [isEligible, setIsEligible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [mensaje, setMensaje] = useState("");

  // Verificar elegibilidad al montar el componente
  useEffect(() => {
    api
      .get(`/api/grupos/${grupoId}/verificar-elegibilidad`, {
        params: { deportistaId: deportista.id },
      })
      .then((res) => {
        setMensaje(res.data.resultado);
        setIsEligible(res.data.resultado.startsWith("Elegible"));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error verificando elegibilidad", err);
        setMensaje("Error al verificar elegibilidad");
        setIsEligible(false);
        setLoading(false);
      });
  }, [grupoId, deportista.id]);

  // Manejar agregar deportista al grupo
  const handleAddToGroup = async () => {
    setAdding(true);
    const payload = { deportistaId: deportista.id, observaciones: "" };

    try {
      const response = await api.post(
        `/api/grupos/${grupoId}/agregar-deportistas`,
        payload,
      );
      toast.success(response.data.mensaje);
      onSuccess();
    } catch (error: any) {
      console.error("Error en agregar deportista:", error);
      toast.error(
        error.response?.data?.mensaje ??
          "Error al agregar deportista. Intenta de nuevo.",
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center justify-between border p-2 rounded">
      <div>
        <p className="font-medium">
          {deportista.nombre} {deportista.apellido} - {deportista.genero} -
          {deportista.nivel}
        </p>
        <p className="text-sm text-gray-600">
          {loading ? "Verificando elegibilidad..." : mensaje}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader className="animate-spin text-gray-500" />
        ) : isEligible ? (
          <CheckCircle className="text-green-600" />
        ) : (
          <XCircle className="text-red-600" />
        )}
        <Button
          disabled={!isEligible || loading || adding}
          onClick={handleAddToGroup}
          variant="secondary"
        >
          {adding ? "Agregando..." : "Añadir"}
        </Button>
      </div>
    </div>
  );
}