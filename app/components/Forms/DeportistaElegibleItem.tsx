import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Loader, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

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
    console.log("Deportista recibido:", deportista);
    fetch(
      `http://localhost:8080/api/grupos/${grupoId}/verificar-elegibilidad?deportistaId=${deportista.id}`
    )
      .then((res) => res.text())
      .then((msg) => {
        setMensaje(msg);
        setIsEligible(msg.startsWith("Elegible"));
        setLoading(false); // ✅ aquí
      })
      .catch((err) => {
        console.error("Error verificando elegibilidad", err);
        setMensaje("Error al verificar elegibilidad");
        setIsEligible(false);
        setLoading(false); // ✅ también aquí por si falla
      });
  }, [grupoId, deportista.id]);

  // Manejar agregar deportista al grupo
  const handleAddToGroup = async () => {
    setAdding(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/grupos/${grupoId}/agregar-deportista`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deportistaId: deportista.id }),
        }
      );

      if (!response.ok) throw new Error("Error al agregar deportista");

      onSuccess();
    } catch (error) {
      toast.error("Error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center justify-between border p-2 rounded">
      <div>
        <p className="font-medium">{deportista.nombre}</p>
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
