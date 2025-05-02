"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Download, Search, FileText, CreditCard, Calendar, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos de ejemplo para pagos
const pagos = [
  {
    id: 1,
    factura_numero: "F-2024-0001",
    cliente: "Sofía Pérez",
    fecha: "2024-04-01",
    monto: 108.0,
    tipo_pago: "Mensualidad",
    metodo_pago: "Tarjeta de Crédito",
    estado: "Pagado",
    concepto: "Mensualidad Abril 2024 - Plan Básico",
  },
  {
    id: 2,
    factura_numero: "F-2024-0002",
    cliente: "Lucas Martínez",
    fecha: "2024-04-01",
    monto: 120.0,
    tipo_pago: "Mensualidad",
    metodo_pago: "Transferencia Bancaria",
    estado: "Pagado",
    concepto: "Mensualidad Abril 2024 - Plan Básico",
  },
  {
    id: 3,
    factura_numero: "F-2024-0004",
    cliente: "Mateo González",
    fecha: "2024-04-05",
    monto: 220.0,
    tipo_pago: "Mensualidad",
    metodo_pago: "Efectivo",
    estado: "Pagado",
    concepto: "Mensualidad Abril 2024 - Plan Competencia",
  },
  {
    id: 4,
    factura_numero: "F-2024-0005",
    cliente: "Valentina López",
    fecha: "2024-04-10",
    monto: 45.99,
    tipo_pago: "Venta",
    metodo_pago: "Tarjeta de Débito",
    estado: "Pagado",
    concepto: "Venta de Uniforme de Entrenamiento",
  },
  {
    id: 5,
    factura_numero: "F-2024-0006",
    cliente: "Isabella Sánchez",
    fecha: "2024-04-12",
    monto: 153.0,
    tipo_pago: "Mensualidad",
    metodo_pago: "Transferencia Bancaria",
    estado: "Pagado",
    concepto: "Mensualidad Abril 2024 - Plan Premium",
  },
]

// Datos de ejemplo para pagos pendientes
const pagosPendientes = [
  {
    id: 1,
    factura_numero: "F-2024-0003",
    cliente: "Emma Rodríguez",
    fecha_vencimiento: "2024-04-15",
    monto: 153.0,
    concepto: "Mensualidad Abril 2024 - Plan Premium",
    dias_vencido: 0,
  },
  {
    id: 2,
    factura_numero: "F-2024-0007",
    cliente: "Nicolás Ramírez",
    fecha_vencimiento: "2024-04-10",
    monto: 108.0,
    concepto: "Mensualidad Abril 2024 - Plan Básico",
    dias_vencido: 5,
  },
]

export default function PagosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState<string | null>(null)
  const [tipoPagoFiltro, setTipoPagoFiltro] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  // Función para ordenar pagos
  const sortPagos = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Aplicar ordenamiento a los pagos
  const sortedPagos = [...pagos].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key as keyof typeof a]
    const bValue = b[sortConfig.key as keyof typeof b]

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Filtrar pagos por término de búsqueda y filtros
  const filteredPagos = sortedPagos.filter((pago) => {
    const matchesSearch =
      pago.factura_numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.concepto.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesMetodoPago = metodoPagoFiltro ? pago.metodo_pago === metodoPagoFiltro : true
    const matchesTipoPago = tipoPagoFiltro ? pago.tipo_pago === tipoPagoFiltro : true

    return matchesSearch && matchesMetodoPago && matchesTipoPago
  })

  // Obtener métodos de pago únicos
  const metodosPago = Array.from(new Set(pagos.map((p) => p.metodo_pago)))

  // Obtener tipos de pago únicos
  const tiposPago = Array.from(new Set(pagos.map((p) => p.tipo_pago)))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Pagos</h1>
          <p className="text-muted-foreground">Administra los pagos y facturas pendientes</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Registrar Pago
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Recaudado (Mes)</CardTitle>
            <CardDescription>Abril 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${pagos.reduce((total, pago) => total + pago.monto, 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CreditCard className="inline h-3 w-3" /> {pagos.length} pagos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pagos Pendientes</CardTitle>
            <CardDescription>Por cobrar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${pagosPendientes.reduce((total, pago) => total + pago.monto, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <Calendar className="inline h-3 w-3" /> {pagosPendientes.length} facturas pendientes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Método de Pago Preferido</CardTitle>
            <CardDescription>Más utilizado</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const metodosCount = pagos.reduce(
                (acc, pago) => {
                  acc[pago.metodo_pago] = (acc[pago.metodo_pago] || 0) + 1
                  return acc
                },
                {} as Record<string, number>,
              )

              const metodoPreferido = Object.entries(metodosCount).sort((a, b) => b[1] - a[1])[0]

              return (
                <>
                  <div className="text-3xl font-bold">{metodoPreferido[0]}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <CreditCard className="inline h-3 w-3" /> {metodoPreferido[1]} pagos (
                    {Math.round((metodoPreferido[1] / pagos.length) * 100)}%)
                  </p>
                </>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pagos Realizados</CardTitle>
            <CardDescription>Historial de pagos registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="flex items-center space-x-2 w-full max-w-sm">
                <Input
                  placeholder="Buscar pagos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9"
                />
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex space-x-2">
                <Select
                  value={metodoPagoFiltro || "all"}
                  onValueChange={(value) => setMetodoPagoFiltro(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Método de Pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {metodosPago.map((metodo) => (
                      <SelectItem key={metodo} value={metodo}>
                        {metodo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={tipoPagoFiltro || "all"}
                  onValueChange={(value) => setTipoPagoFiltro(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de Pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tiposPago.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortPagos("factura_numero")}>
                        Factura
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortPagos("cliente")}>
                        Cliente
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortPagos("fecha")}>
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortPagos("monto")}>
                        Monto
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagos.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell className="font-medium">{pago.factura_numero}</TableCell>
                      <TableCell>{pago.cliente}</TableCell>
                      <TableCell>{new Date(pago.fecha).toLocaleDateString()}</TableCell>
                      <TableCell>${pago.monto.toFixed(2)}</TableCell>
                      <TableCell>{pago.concepto}</TableCell>
                      <TableCell>{pago.tipo_pago}</TableCell>
                      <TableCell>{pago.metodo_pago}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" /> Ver Factura
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagos Pendientes</CardTitle>
            <CardDescription>Facturas pendientes de pago</CardDescription>
          </CardHeader>
          <CardContent>
            {pagosPendientes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagosPendientes.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell className="font-medium">{pago.factura_numero}</TableCell>
                      <TableCell>{pago.cliente}</TableCell>
                      <TableCell>{new Date(pago.fecha_vencimiento).toLocaleDateString()}</TableCell>
                      <TableCell>${pago.monto.toFixed(2)}</TableCell>
                      <TableCell>{pago.concepto}</TableCell>
                      <TableCell>
                        <Badge variant={pago.dias_vencido > 0 ? "destructive" : "outline"}>
                          {pago.dias_vencido > 0 ? `Vencido (${pago.dias_vencido} días)` : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm">
                          <CreditCard className="h-4 w-4 mr-1" /> Registrar Pago
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No hay pagos pendientes</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
