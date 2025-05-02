"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Filter, Download, Search, ShoppingBag, ArrowUpDown, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo para productos
const productos = [
  {
    id: 1,
    nombre: "Uniforme de Entrenamiento",
    descripcion: "Uniforme oficial para entrenamiento",
    precio: 45.99,
    cantidad_stock: 25,
    stock_minimo: 10,
  },
  {
    id: 2,
    nombre: "Uniforme de Competencia",
    descripcion: "Uniforme oficial para competencias",
    precio: 89.99,
    cantidad_stock: 15,
    stock_minimo: 5,
  },
  {
    id: 3,
    nombre: "Zapatillas de Cheer",
    descripcion: "Zapatillas especiales para cheerleading",
    precio: 65.5,
    cantidad_stock: 8,
    stock_minimo: 10,
  },
  {
    id: 4,
    nombre: "Pompones",
    descripcion: "Par de pompones oficiales",
    precio: 18.99,
    cantidad_stock: 40,
    stock_minimo: 15,
  },
  {
    id: 5,
    nombre: "Shorts de Entrenamiento",
    descripcion: "Shorts deportivos para entrenamiento",
    precio: 22.5,
    cantidad_stock: 30,
    stock_minimo: 12,
  },
  {
    id: 6,
    nombre: "Camiseta con Logo",
    descripcion: "Camiseta con el logo del gimnasio",
    precio: 19.99,
    cantidad_stock: 35,
    stock_minimo: 15,
  },
  {
    id: 7,
    nombre: "Botella de Agua",
    descripcion: "Botella deportiva con logo",
    precio: 12.99,
    cantidad_stock: 20,
    stock_minimo: 10,
  },
  {
    id: 8,
    nombre: "Mochila Deportiva",
    descripcion: "Mochila con logo del gimnasio",
    precio: 39.99,
    cantidad_stock: 12,
    stock_minimo: 8,
  },
]

// Datos de ejemplo para movimientos de inventario
const movimientos = [
  {
    id: 1,
    producto_id: 1,
    tipo: "entrada",
    cantidad: 10,
    fecha: "2024-04-10T14:30:00",
    usuario: "Admin",
  },
  {
    id: 2,
    producto_id: 2,
    tipo: "entrada",
    cantidad: 5,
    fecha: "2024-04-10T14:35:00",
    usuario: "Admin",
  },
  {
    id: 3,
    producto_id: 3,
    tipo: "salida",
    cantidad: 2,
    fecha: "2024-04-11T10:15:00",
    usuario: "Vendedor1",
  },
  {
    id: 4,
    producto_id: 4,
    tipo: "salida",
    cantidad: 4,
    fecha: "2024-04-12T16:20:00",
    usuario: "Vendedor2",
  },
  {
    id: 5,
    producto_id: 1,
    tipo: "ajuste",
    cantidad: -1,
    fecha: "2024-04-13T09:45:00",
    usuario: "Admin",
  },
]

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  // Función para ordenar productos
  const sortProducts = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Aplicar ordenamiento a los productos
  const sortedProducts = [...productos].sort((a, b) => {
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

  // Filtrar productos por término de búsqueda
  const filteredProducts = sortedProducts.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Obtener nombre del producto por ID
  const getProductName = (productoId: number) => {
    const producto = productos.find((p) => p.id === productoId)
    return producto ? producto.nombre : "Producto desconocido"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">Gestiona el inventario de productos</p>
        </div>
      </div>

      <Tabs defaultValue="productos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
        </TabsList>

        {/* Pestaña de Productos */}
        <TabsContent value="productos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Productos</CardTitle>
                <CardDescription>Gestiona los productos disponibles en el inventario</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2 w-full max-w-sm">
                  <Input
                    placeholder="Buscar productos..."
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
                        Filtrar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Todos los productos</DropdownMenuItem>
                      <DropdownMenuItem>Stock bajo</DropdownMenuItem>
                      <DropdownMenuItem>Sin stock</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortProducts("nombre")}>
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortProducts("precio")}>
                        Precio
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortProducts("cantidad_stock")}>
                        Stock
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell>{producto.id}</TableCell>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell>{producto.descripcion}</TableCell>
                      <TableCell>${producto.precio.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {producto.cantidad_stock}
                          {producto.cantidad_stock < producto.stock_minimo && (
                            <AlertTriangle className="ml-2 h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            producto.cantidad_stock === 0
                              ? "destructive"
                              : producto.cantidad_stock < producto.stock_minimo
                                ? "secondary"
                                : "default"
                          }
                        >
                          {producto.cantidad_stock === 0
                            ? "Sin stock"
                            : producto.cantidad_stock < producto.stock_minimo
                              ? "Stock bajo"
                              : "Disponible"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            <ShoppingBag className="h-4 w-4 mr-1" /> Movimiento
                          </Button>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Movimientos */}
        <TabsContent value="movimientos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Movimientos de Inventario</CardTitle>
                <CardDescription>Historial de entradas, salidas y ajustes de inventario</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2 w-full max-w-sm">
                  <Input placeholder="Buscar movimientos..." className="h-9" />
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Todos los movimientos</DropdownMenuItem>
                      <DropdownMenuItem>Entradas</DropdownMenuItem>
                      <DropdownMenuItem>Salidas</DropdownMenuItem>
                      <DropdownMenuItem>Ajustes</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((movimiento) => (
                    <TableRow key={movimiento.id}>
                      <TableCell>{movimiento.id}</TableCell>
                      <TableCell className="font-medium">{getProductName(movimiento.producto_id)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            movimiento.tipo === "entrada"
                              ? "default"
                              : movimiento.tipo === "salida"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{movimiento.cantidad}</TableCell>
                      <TableCell>{new Date(movimiento.fecha).toLocaleString()}</TableCell>
                      <TableCell>{movimiento.usuario}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
