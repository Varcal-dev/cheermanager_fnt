"use client"
import { useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [serverMessage, setServerMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setServerMessage("")
    try {
      const response = await axios.post(
        "http://localhost:8080/api/login",
        {
          email: email,
          password: password,
        },
        {
            withCredentials: true,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
      // Mostrar mensaje del servidor
      if (response.data.success) {
        setServerMessage(response.data.message || "")
        setTimeout(() => {
          window.location.href = "/"
        })
      } else {
        setError("Credenciales incorrectas")
      }
    } catch (err) {
      setError("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 to-purple-50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Iniciar Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Correo electrónico</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Entrar"}
            </Button>
            {serverMessage && <div className="text-blue-600 text-sm">{serverMessage}</div>}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}