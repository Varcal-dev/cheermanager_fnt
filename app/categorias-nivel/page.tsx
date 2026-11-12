import { redirect } from "next/navigation";

// Ruta anterior: ahora vive en una pantalla con pestañas.
export default function Redireccion() {
  redirect("/estructura-deportiva?tab=categorias");
}
