"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { api, setAuthToken } from "@/lib/api";
import { useUser } from "@/context/UserContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        setAuthToken(response.data.token);
        // Refrescamos el UserContext ANTES de navegar para que el resto de la
        // app (Sidebar, ProtectedRoute, etc.) ya tenga el usuario/permisos
        // cargados en cuanto llegue a la siguiente pantalla.
        await refreshUser();

        if (response.data.requiereCambioPassword) {
          // Usuario con contraseña por defecto (ej. deportistas/entrenadores
          // creados automáticamente con "0000"): forzamos cambio antes de
          // dejarlo entrar al resto del sistema.
          router.push("/cambiar-password");
        } else {
          router.push("/");
        }
      } else {
        setError(response.data.message || "No se pudo iniciar sesión");
      }
    } catch (err: any) {
      // El backend devuelve el mensaje de error en response.data.message
      // tanto para credenciales inválidas (401/404) como cuenta bloqueada (423).
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Error al conectar con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };


return (
<main className="relative isolate h-[100dvh] w-full overflow-hidden bg-[#12091f]">
    {/* Imagen de fondo */}
    <div className="absolute inset-0 z-0">
  <Image
    src="/brand/background.png"
    alt=""
    fill
    priority
    sizes="100vw"
    className="object-cover object-center"
  />
</div>

    {/* Overlay para mejorar la legibilidad */}
    <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-black/40 to-purple-950/20" />

    {/* Capa adicional para móviles */}
    <div className="absolute inset-0 z-10 bg-black/10 md:bg-transparent" />

    {/* Contenido */}
    <div className="relative z-20 flex min-h-screen items-center justify-center p-4 md:justify-start md:pl-[8vw]">

      <Card className="w-full max-w-md border border-white/10 bg-[#19151e]/95 text-white shadow-2xl shadow-black/40 backdrop-blur-md">

        <CardHeader className="items-center space-y-2 text-center">

          <CardTitle className="text-3xl font-bold tracking-tight text-[#ff477e]">
            CheerManager
          </CardTitle>

          <CardDescription className="text-gray-300">
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>

        </CardHeader>

        <form onSubmit={handleSubmit}>

          <CardContent className="space-y-4">

            {error && (
              <Alert variant="destructive" className="text-sm py-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-100">
                Email
              </Label>

              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Ingrese su email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="border-white/10 bg-black/30 text-white placeholder:text-gray-500 focus-visible:ring-[#ff477e]"
              />
            </div>

            <div className="space-y-2">

              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-100">
                  Contraseña
                </Label>

                <Link
                  href="/recuperar-password"
                  className="text-xs text-[#ff477e] hover:underline"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="border-white/10 bg-black/30 pr-10 text-white placeholder:text-gray-500 focus-visible:ring-[#ff477e]"
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                name="remember"
                checked={formData.remember}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    remember: checked === true,
                  }))
                }
              />

              <Label htmlFor="remember" className="text-sm text-gray-200">
                Recordarme
              </Label>
            </div>

          </CardContent>

          <CardFooter className="flex flex-col space-y-4">

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#b80f45] text-white hover:bg-[#d01855] transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-2.647-2.647z"
                    />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={18} />
                  Iniciar Sesión
                </span>
              )}
            </Button>

            <p className="text-xs text-center text-gray-400">
              Al iniciar sesión, acepta nuestros{" "}
              <Link
                href="/terminos"
                className="text-[#ff477e] hover:underline"
              >
                términos de servicio
              </Link>{" "}
              y{" "}
              <Link
                href="/privacidad"
                className="text-[#ff477e] hover:underline"
              >
                política de privacidad
              </Link>
            </p>

          </CardFooter>
        </form>

      </Card>
    </div>
  </main>
);

}