import type { NextConfig } from "next";

// Las variables NEXT_PUBLIC_* ya se incorporan solas al build; no hace falta (y es dañino) redefinirlas aquí:
// la versión anterior convertía una variable ausente en el TEXTO "undefined" y el front llamaba a "undefined/api/login".
// El valor por defecto (http://localhost:8081) vive en lib/api.ts.
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;