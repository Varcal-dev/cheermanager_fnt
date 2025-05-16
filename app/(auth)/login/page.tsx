"use client";
import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";

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
  //const [email, setEmail] = useState("")
  //const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

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
    setServerMessage("");
    try {
      const response = await axios.post(
        "http://localhost:8080/api/login",
        {
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // Mostrar siempre el mensaje del servidor
      setServerMessage(response.data.message || "");
      if (response.data.success) {
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (err: any) {
      // Si el backend responde con error, mostrar el mensaje del backend si existe
      if (err.response && err.response.data && err.response.data.message) {
        setServerMessage(err.response.data.message);
      } else {
        setServerMessage("Error al conectar con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-600 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 items-center text-center">
          <div className="w-20 h-20 mb-2 relative">
            <Image
              src="/placeholder.svg?height=80&width=80"
              alt="Cheer Gym Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Cheer Gym
          </CardTitle>
          <CardDescription>
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
              <Label htmlFor="username">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="Ingrese su email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/recuperar-password"
                  className="text-xs text-primary hover:underline"
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
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
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
              <Label htmlFor="remember" className="text-sm">
                Recordarme
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
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
            <p className="text-xs text-center text-muted-foreground">
              Al iniciar sesión, acepta nuestros{" "}
              <Link href="/terminos" className="text-primary hover:underline">
                términos de servicio
              </Link>{" "}
              y{" "}
              <Link href="/privacidad" className="text-primary hover:underline">
                política de privacidad
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
