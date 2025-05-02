"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Filter,
  Download,
  Search,
  FileText,
  CreditCard,
  Printer,
  Mail,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo para facturas
const facturas = [
  {
    id: 1,
    numero_factura: "F-2024-0001",
    fecha_emision: "2024-04-01",
    cliente: "Sofía Pérez",
    descripcion: "Mensualidad Abril 2024 - Plan Básico",
    sub_total: 120.0,
    descuento: "Descuento por Hermanos",
    valor_descuento: 12.0,
    total: 108.0,
    estado_pago: "Pagado",
  },
  {
    id: 2,
    numero_factura: "F-2024-0002",
    fecha_emision: "2024-04-01",
    cliente: "Lucas Martínez",
    descripcion: "Mensualidad Abril 2024 - Plan Básico",
    sub_total: 120.0,
    descuento: "Sin descuento",
    valor_descuento: 0.0,
    total: 120.0,
    estado_pago: "Pagado",
  },
  {
    id: 3,
    numero_factura: "F-2024-0003",
    fecha_emision: "2024-04-02",
    cliente: "Emma Rodríguez",
    descripcion: "Mensualidad Abril 2024 - Plan Premium",
    sub_total: 180.0,
    descuento: "Descuento Colegio San Patricio",
    valor_descuento: 27.0,
    total: 153.0,
    estado_pago: "Pendiente",
  },
  {
    id: 4,
    numero_factura: "F-2024-0004",
    fecha_emision: "2024-04-05",
    cliente: "Mateo González",
    descripcion: "Mensualidad Abril 2024 - Plan Competencia",
    sub_total: 220.0,
    descuento: "Sin descuento",
    valor_descuento: 0.0,
    total: 220.0,
    estado_pago: "Pagado",
  },
  {
    id: 5,
    numero_factura: "F-2024-0005",
    fecha_emision: "2024-04-10",
    cliente: "Valentina López",
    descripcion: "Venta de Uniforme de Entrenamiento",
    sub_total: 45.99,
    descuento: "Sin descuento",
    valor_descuento: 0.0,
    total: 45.99,
    estado_pago: "Pagado",
  },
]

// Datos de ejemplo para pagos
const pagos = [
  {
    id: 1,
    factura_id: 1,
    factura_numero: "F-2024-0001",
    cliente: "Sofía Pérez",
    fecha: "2024-04-01",
    monto: 108.0,
    tipo_pago: "Mensualidad",
    metodo_pago: "Tarjeta de Crédito",
    estado: "Pagado",
  },
  {
    id: 2,
    factura_id: 2,
    factura_numero: "F-2024-0002",
    cliente: "Lucas Martínez",
    fecha: "2024-04-01",
    monto: 120.0,
    tipo_pago: "Mensualidad",
    metodo_pago: "Transferencia Bancaria",
    estado: "Pagado",
  },
  {
    id: 4,
    factura_id: 4,
    factura_numero: "F-2024-0004",
    cliente: "Mateo González",
    fecha: "2024-04-05",
    monto: 220.0,
    tipo_pago: "Mensualidad",
    metodo_pago: "Efectivo",
    estado: "Pagado",
  },
  {
    id: 5,
    factura_id: 5,
    factura_numero: "F-2024-0005",
    cliente: "Valentina López",
    fecha: "2024-04-10",
    monto: 45.99,
    tipo_pago: "Venta",
    metodo_pago: "Tarjeta de Débito",
    estado: "Pagado",
  },
]

export default function FacturasPage() {
  const [expandedFacturas, setExpandedFacturas] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("facturas")
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>(null)

  const toggleFacturaExpand = (facturaId: number) => {
    setExpandedFacturas((prev) =>
      prev.includes(facturaId) ? prev.filter((id) => id !== facturaId) : [...prev, facturaId],
    )
  }

  // Filtrar facturas por término de búsqueda y estado
  const filteredFacturas = facturas.filter((factura) => {
    const matchesSearch =
      factura.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.descripcion.toLowerCase().includes(searchTerm.toLowerCase())

    if (estadoFiltro) {
      return matchesSearch && factura.estado_pago === estadoFiltro
    }
    return matchesSearch
  })

  // Filtrar pagos por término de búsqueda
  const filteredPagos = pagos.filter((pago) => {
    return (
      pago.factura_numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Obtener pago para una factura
  const getPagoFactura = (facturaId: number) => {
    return pagos.find((p) => p.factura_id === facturaId)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas y Pagos</h1>
          <p className="text-muted-foreground">Gestiona las facturas y pagos de los deportistas</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva Factura
        </Button>
      </div>

      <Tabs defaultValue="facturas" className="w-full" onValueChange={setActiveTab}>
        <TabsContent value="facturas" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <Input
                placeholder="Buscar facturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    {estadoFiltro || "Filtrar por Estado"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEstadoFiltro(null)}>Todos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEstadoFiltro("Pagado")}>Pagado</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEstadoFiltro("Pendiente")}>Pendiente</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEstadoFiltro("Vencido")}>Vencido</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFacturas.map((factura) => (
                    <>
                      <TableRow key={factura.id}>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => toggleFacturaExpand(factura.id)}>
                            {expandedFacturas.includes(factura.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{factura.numero_factura}</TableCell>
                        <TableCell>{new Date(factura.fecha_emision).toLocaleDateString()}</TableCell>
                        <TableCell>{factura.cliente}</TableCell>
                        <TableCell>{factura.descripcion}</TableCell>
                        <TableCell>${factura.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              factura.estado_pago === "Pagado"
                                ? "default"
                                : factura.estado_pago === "Pendiente"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {factura.estado_pago}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-1" /> Editar
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <FileText className="h-4 w-4 mr-1" /> Acciones
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Printer className="h-4 w-4 mr-2" /> Imprimir
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" /> Enviar por Email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <CreditCard className="h-4 w-4 mr-2" /> Registrar Pago
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedFacturas.includes(factura.id) && (
                        <TableRow key={`${factura.id}-details`} className="bg-muted/50">
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Detalles de la Factura</h4>
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Subtotal:</span>
                                      <span>${factura.sub_total.toFixed(2)}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Descuento:</span>
                                      <span>
                                        {factura.descuento} (${factura.valor_descuento.toFixed(2)})
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Total:</span>
                                      <span className="font-bold">${factura.total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Información de Pago</h4>
                                  {factura.estado_pago === "Pagado" ? (
                                    <div className="space-y-2">
                                      {(() => {
                                        const pago = getPagoFactura(factura.id)
                                        if (pago) {
                                          return (
                                            <>
                                              <div className="grid grid-cols-2">
                                                <span className="text-muted-foreground">Fecha de Pago:</span>
                                                <span>{new Date(pago.fecha).toLocaleDateString()}</span>
                                              </div>
                                              <div className="grid grid-cols-2">
                                                <span className="text-muted-foreground">Método de Pago:</span>
                                                <span>{pago.metodo_pago}</span>
                                              </div>
                                              <div className="grid grid-cols-2">
                                                <span className="text-muted-foreground">Tipo de Pago:</span>
                                                <span>{pago.tipo_pago}</span>
                                              </div>
                                            </>
                                          )
                                        } else {
                                          return (
                                            <span className="text-muted-foreground">
                                              Información de pago no disponible
                                            </span>
                                          )
                                        }
                                      })()}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col space-y-2">
                                      <span className="text-muted-foreground">Pago pendiente</span>
                                      <Button size="sm">
                                        <CreditCard className="h-4 w-4 mr-1" /> Registrar Pago
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
