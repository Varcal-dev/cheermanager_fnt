import type { ReactNode } from "react";
import Image from "next/image";

/**
 * Fondo de las pantallas de acceso: login, recuperar contraseña, restablecer,
 * cambiar contraseña y términos.
 *
 * - La foto queda fija (fixed) detrás: en páginas largas, como términos, el contenido
 *   se desplaza y la foto no.
 * - En teléfono se carga la versión liviana (1000 px); desde `sm`, la completa.
 * - El degradado oscuro garantiza que el formulario se lea sobre cualquier parte de la foto.
 *
 * alinear="izquierda": en tablet y escritorio el formulario va a la izquierda y deja
 * ver a la acróbata a la derecha (así se ve en el login). En teléfono siempre va centrado.
 */
export function AuthFondo({
  children,
  alinear = "centro",
}: {
  children: ReactNode;
  alinear?: "centro" | "izquierda";
}) {
  return (
    <main className="relative isolate min-h-dvh w-full bg-[#12091f]">
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/brand/fondo-login-movil.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center] sm:hidden"
        />
        <Image
          src="/brand/fondo-login.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-center sm:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-purple-950/20" />
        <div className="absolute inset-0 bg-black/10 md:bg-transparent" />
      </div>

      <div
        className={`relative flex min-h-dvh items-center justify-center p-4 ${
          alinear === "izquierda" ? "md:justify-start md:pl-[8vw]" : ""
        }`}
      >
        {children}
      </div>
    </main>
  );
}

export default AuthFondo;
