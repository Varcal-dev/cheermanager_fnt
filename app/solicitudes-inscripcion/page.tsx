import { redirect } from "next/navigation";

// Ruta anterior: ahora vive en una pantalla con pestañas.
export default function Redireccion() {
  redirect("/inscripciones?tab=solicitudes");
}
