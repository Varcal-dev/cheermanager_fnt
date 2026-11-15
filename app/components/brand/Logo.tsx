import Image from "next/image"

/**
 * Logo de CheerManager.
 *
 * variante: "horizontal" (isotipo + nombre en una línea), "vertical" (isotipo arriba, nombre abajo)
 *           o "isotipo" (solo las letras CM).
 * tono:     "color"  → vino y negro (fondos claros)
 *           "negro"  → una sola tinta negra (impresos, sellos, fotocopias)
 *           "blanco" → una sola tinta blanca (fondos oscuros o con foto)
 *           "auto"   → color en modo claro y blanco en modo oscuro (clase `.dark`)
 * alto:     alto en píxeles; el ancho se calcula solo para no deformar.
 */

type Variante = "horizontal" | "vertical" | "isotipo"
type Tono = "color" | "negro" | "blanco" | "auto"

// Tamaño real de cada archivo en /public/brand (para mantener la proporción)
const MEDIDAS: Record<Variante, { w: number; h: number }> = {
  horizontal: { w: 760, h: 118 },
  vertical: { w: 493, h: 265 },
  isotipo: { w: 401, h: 204 },
}

function archivo(variante: Variante, tono: Exclude<Tono, "auto">) {
  const sufijo = tono === "color" ? "" : `-${tono}`
  return `/brand/cheermanager-${variante}${sufijo}.png`
}

interface LogoProps {
  variante?: Variante
  tono?: Tono
  alto?: number
  className?: string
  /** true en el login y en lo que se ve al cargar la página (evita parpadeo) */
  prioridad?: boolean
}

export function Logo({
  variante = "horizontal",
  tono = "auto",
  alto = 32,
  className = "",
  prioridad = false,
}: LogoProps) {
  const { w, h } = MEDIDAS[variante]
  const ancho = Math.round((alto * w) / h)
  const comunes = {
    width: ancho,
    height: alto,
    alt: "CheerManager",
    priority: prioridad,
    style: { width: ancho, height: alto },
  }

  if (tono === "auto") {
    return (
      <span className={`inline-flex ${className}`}>
        <Image src={archivo(variante, "color")} className="dark:hidden" {...comunes} />
        <Image
          src={archivo(variante, "blanco")}
          className="hidden dark:block"
          {...comunes}
          alt=""
          aria-hidden
        />
      </span>
    )
  }

  return <Image src={archivo(variante, tono)} className={className} {...comunes} />
}

export default Logo
