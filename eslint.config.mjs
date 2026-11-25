import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

// TST-01: lint con las reglas de Next. Los hallazgos que ya existian (usos de `any`, variables sin uso) son AVISOS y
// la CI limita su numero (--max-warnings en .github/workflows/ci.yml): no se puede añadir ninguno nuevo, solo bajarlos.
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts", "tailwind.config.ts"] },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Comillas y apostrofos en textos JSX en español: React los muestra bien, solo era ruido.
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];
