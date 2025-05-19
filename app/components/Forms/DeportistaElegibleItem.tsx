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
    console.log("Deportista recibido:", deportista);
    fetch(
      `http://localhost:8080/api/grupos/${grupoId}/verificar-elegibilidad?deportistaId=${deportista.id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setMensaje(data.resultado);
        setIsEligible(data.resultado.startsWith("Elegible"));
        setLoading(false);
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
    // Construir el payload
    const payload = {
      deportistaId: deportista.id,
      observaciones: "", // reemplaza si tienes un input de observaciones
    };

    // Mostrar en consola lo que se va a enviar
    console.log("Enviando al backend:", payload);
    try {
      const response = await axios.post(
        `http://localhost:8080/api/grupos/${grupoId}/agregar-deportistas`, // Usar la ruta más RESTful si la cambiaste en el backend
        {
          deportistaId: deportista.id,
          observaciones: "", // O la cadena de observaciones que el usuario haya ingresado
        }
        // Agregar las cabeceras si usas autenticación
        // {
        //   headers: {
        //     'Authorization': `Bearer ${tuTokenJWT}`
        //   }
        // }
      );

      // Manejar la respuesta del backend (el mensaje del stored procedure)
      // Si el backend devuelve RespuestaDTO:
      console.log("Respuesta del backend:", response.data.mensaje);
      toast.success(response.data.mensaje); // Muestra el mensaje del backend

      onSuccess();
    } catch (error) {
      console.error("Error en agregar deportista:", error);

      // Si el error proviene del backend y devuelve RespuestaDTO con el mensaje de error:
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data?.mensaje
      ) {
        toast.error(error.response.data.mensaje);
      } else {
        toast.error("Error al agregar deportista. Intenta de nuevo.");
      }
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
