import type { NextConfig } from "next";

// Las variables NEXT_PUBLIC_* ya se incorporan solas al build; no hace falta (y es dañino) redefinirlas aquí.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
const esDev = process.env.NODE_ENV !== "production";

// CSP: solo se permite cargar lo que la app realmente usa (mismo origen + la API). Next inyecta scripts en línea para
// hidratar, y Tailwind/recharts/react-toastify usan estilos en línea; por eso 'unsafe-inline' (un nonce obligaría a
// renderizar todo de forma dinámica). Lo que sí se cierra: scripts de otros dominios, iframes, <object>, <base> y
// formularios hacia afuera. 'unsafe-eval' solo en desarrollo (React lo usa para el overlay de errores).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${API_URL}${esDev ? " ws://localhost:3000" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(esDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// La CSP BLOQUEA por defecto (SEC-04). Para volver a solo informar (el navegador avisa en consola y no bloquea), por ejemplo si
// una pantalla nueva necesita un origen que aun no esta en la politica: define CSP_ENFORCE=false en Vercel y vuelve a desplegar.
// Si agregas analitica, Turnstile/reCAPTCHA o una pasarela embebida, anade su dominio a script-src/connect-src/frame-src.
const cabeceraCsp = process.env.CSP_ENFORCE === "false" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: cabeceraCsp, value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // La camara solo para esta app (lector de QR de asistencia: getUserMedia); sin microfono, geolocalizacion ni pagos.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
