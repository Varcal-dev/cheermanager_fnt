"use client"

import { useState, useEffect } from "react"
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  DollarSign,
  Save,
  FileText,
  Printer,
  Filter,
  LayoutGrid,
  List,
  Users,
  Tag,
  FilePlus,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Tipos para los productos y ventas
interface Producto {
  id: string
  nombre: string
  precio: number
  categoria: string
  stock: number
  codigo: string
  imagen?: string
}

interface ItemCarrito {
  producto: Producto
  cantidad: number
  subtotal: number
}

interface Cliente {
  id: string
  nombre: string
  email: string
  telefono: string
  esDeportista: boolean
}

// Categorías de productos
const categorias = ["Todos", "Ropa", "Accesorios", "Calzado", "Uniformes", "Equipo"]

// Datos de ejemplo
const productosEjemplo: Producto[] = [
  { id: "1", nombre: "Camiseta Oficial", precio: 25000, categoria: "Ropa", stock: 15, codigo: "R001" },
  { id: "2", nombre: "Shorts de Entrenamiento", precio: 22000, categoria: "Ropa", stock: 20, codigo: "R002" },
  { id: "3", nombre: "Calcetines Deportivos", precio: 8000, categoria: "Accesorios", stock: 30, codigo: "A001" },
  { id: "4", nombre: "Botella de Agua", precio: 12000, categoria: "Accesorios", stock: 25, codigo: "A002" },
  { id: "5", nombre: "Moño Competición", precio: 15000, categoria: "Accesorios", stock: 18, codigo: "A003" },
  { id: "6", nombre: "Sudadera Equipo", precio: 45000, categoria: "Ropa", stock: 10, codigo: "R003" },
  { id: "7", nombre: "Mochila Deportiva", precio: 38000, categoria: "Accesorios", stock: 12, codigo: "A004" },
  { id: "8", nombre: "Zapatillas Cheer", precio: 85000, categoria: "Calzado", stock: 8, codigo: "C001" },
  { id: "9", nombre: "Uniforme Competición", precio: 120000, categoria: "Uniformes", stock: 5, codigo: "U001" },
  { id: "10", nombre: "Guantes de Entrenamiento", precio: 18000, categoria: "Accesorios", stock: 15, codigo: "A005" },
  { id: "11", nombre: "Medias de Compresión", precio: 15000, categoria: "Ropa", stock: 22, codigo: "R004" },
  { id: "12", nombre: "Camiseta de Entrenamiento", precio: 20000, categoria: "Ropa", stock: 25, codigo: "R005" },
]

const clientesEjemplo: Cliente[] = [
  { id: "1", nombre: "Ana Martínez", email: "ana@example.com", telefono: "123456789", esDeportista: true },
  { id: "2", nombre: "Carlos López", email: "carlos@example.com", telefono: "987654321", esDeportista: false },
  { id: "3", nombre: "María Rodríguez", email: "maria@example.com", telefono: "456789123", esDeportista: true },
  { id: "4", nombre: "Juan Pérez", email: "juan@example.com", telefono: "234567891", esDeportista: true },
  { id: "5", nombre: "Laura Gómez", email: "laura@example.com", telefono: "345678912", esDeportista: false },
]

// Historial de ventas recientes
const ventasRecientes = [
  { id: "V001", fecha: "2024-04-28", cliente: "Ana Martínez", total: 120000, estado: "Completada" },
  { id: "V002", fecha: "2024-04-27", cliente: "Carlos López", total: 58000, estado: "Completada" },
  { id: "V003", fecha: "2024-04-26", cliente: "María Rodríguez", total: 95000, estado: "Completada" },
  { id: "V004", fecha: "2024-04-25", cliente: "Juan Pérez", total: 45000, estado: "Completada" },
  { id: "V005", fecha: "2024-04-24", cliente: "Laura Gómez", total: 75000, estado: "Completada" },
]

export default function VentasPage() {
  const [busqueda, setBusqueda] = useState("")
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("")
  const [metodoPago, setMetodoPago] = useState<string>("efectivo")
  const [aplicarDescuento, setAplicarDescuento] = useState(false)
  const [porcentajeDescuento, setPorcentajeDescuento] = useState(0)
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [mostrarFactura, setMostrarFactura] = useState(false)
  const [ventaCompletada, setVentaCompletada] = useState(false)
  const [numeroFactura, setNumeroFactura] = useState("")
  const [categoriaActiva, setCategoriaActiva] = useState("Todos")
  const [vistaProductos, setVistaProductos] = useState<"grid" | "list">("grid")
  const [codigoProducto, setCodigoProducto] = useState("")
  const [cantidadManual, setCantidadManual] = useState<number>(1)
  const [ultimoProductoEscaneado, setUltimoProductoEscaneado] = useState<Producto | null>(null)
  const [mostrarBusquedaCliente, setMostrarBusquedaCliente] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState<"venta" | "recientes">("venta")

  // Filtrar productos según la búsqueda y categoría
  const productosFiltrados = productosEjemplo.filter(
    (producto) =>
      (categoriaActiva === "Todos" || producto.categoria === categoriaActiva) &&
      (producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.categoria.toLowerCase().includes(busqueda.toLowerCase())),
  )

  // Filtrar clientes según la búsqueda
  const clientesFiltrados = clientesEjemplo.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
      cliente.email.toLowerCase().includes(busquedaCliente.toLowerCase()),
  )

  // Escuchar tecla Enter en el campo de código de producto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement === document.getElementById("codigo-producto")) {
        buscarPorCodigo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [codigoProducto])

  // Buscar producto por código
  const buscarPorCodigo = () => {
    if (!codigoProducto) return

    const producto = productosEjemplo.find((p) => p.codigo.toLowerCase() === codigoProducto.toLowerCase())

    if (producto) {
      agregarAlCarrito(producto, cantidadManual)
      setUltimoProductoEscaneado(producto)
      // Limpiar después de un tiempo breve
      setTimeout(() => setUltimoProductoEscaneado(null), 3000)
    }

    setCodigoProducto("")
    setCantidadManual(1)
  }

  // Añadir producto al carrito
  const agregarAlCarrito = (producto: Producto, cantidad = 1) => {
    if (producto.stock < cantidad) {
      alert(`Solo hay ${producto.stock} unidades disponibles de ${producto.nombre}`)
      return
    }

    const itemExistente = carrito.find((item) => item.producto.id === producto.id)

    if (itemExistente) {
      // Si ya existe, aumentar cantidad
      const nuevaCantidad = itemExistente.cantidad + cantidad

      if (nuevaCantidad > producto.stock) {
        alert(`No hay suficiente stock. Solo quedan ${producto.stock} unidades`)
        return
      }

      const nuevoCarrito = carrito.map((item) =>
        item.producto.id === producto.id
          ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.producto.precio }
          : item,
      )
      setCarrito(nuevoCarrito)
    } else {
      // Si no existe, añadir nuevo item
      setCarrito([
        ...carrito,
        {
          producto,
          cantidad: cantidad,
          subtotal: producto.precio * cantidad,
        },
      ])
    }
  }

  // Cambiar cantidad de un producto en el carrito
  const cambiarCantidad = (id: string, cambio: number) => {
    const nuevoCarrito = carrito.map((item) => {
      if (item.producto.id === id) {
        const nuevaCantidad = Math.max(1, item.cantidad + cambio)

        if (nuevaCantidad > item.producto.stock) {
          alert(`No hay suficiente stock. Solo quedan ${item.producto.stock} unidades`)
          return item
        }

        return {
          ...item,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * item.producto.precio,
        }
      }
      return item
    })
    setCarrito(nuevoCarrito)
  }

  // Establecer cantidad específica
  const establecerCantidad = (id: string, cantidad: number) => {
    const item = carrito.find((item) => item.producto.id === id)

    if (!item) return

    if (cantidad > item.producto.stock) {
      alert(`No hay suficiente stock. Solo quedan ${item.producto.stock} unidades`)
      return
    }

    const nuevoCarrito = carrito.map((item) =>
      item.producto.id === id ? { ...item, cantidad, subtotal: cantidad * item.producto.precio } : item,
    )

    setCarrito(nuevoCarrito)
  }

  // Eliminar producto del carrito
  const eliminarDelCarrito = (id: string) => {
    setCarrito(carrito.filter((item) => item.producto.id !== id))
  }

  // Calcular subtotal
  const subtotal = carrito.reduce((total, item) => total + item.subtotal, 0)

  // Calcular descuento
  const descuento = aplicarDescuento ? subtotal * (porcentajeDescuento / 100) : 0

  // Calcular IVA (19%)
  const iva = (subtotal - descuento) * 0.19

  // Calcular total
  const total = subtotal - descuento + iva

  // Completar venta
  const completarVenta = () => {
    if (carrito.length === 0) {
      alert("No hay productos en el carrito")
      return
    }

    // Aquí iría la lógica para registrar la venta en la base de datos
    // Generar número de factura (simulado)
    const nuevoNumeroFactura = `F-${Date.now().toString().slice(-6)}`
    setNumeroFactura(nuevoNumeroFactura)
    setVentaCompletada(true)
    setMostrarFactura(true)
  }

  // Iniciar nueva venta
  const nuevaVenta = () => {
    setCarrito([])
    setClienteSeleccionado("")
    setMetodoPago("efectivo")
    setAplicarDescuento(false)
    setPorcentajeDescuento(0)
    setVentaCompletada(false)
    setMostrarFactura(false)
    setBusqueda("")
    setCategoriaActiva("Todos")
  }

  // Obtener cliente seleccionado
  const getClienteSeleccionado = () => {
    return clientesEjemplo.find((cliente) => cliente.id === clienteSeleccionado)
  }

  // Calcular número de artículos
  const totalArticulos = carrito.reduce((total, item) => total + item.cantidad, 0)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sistema de Punto de Venta</h1>
        <div className="flex gap-2">
          <Tabs value={seccionActiva} onValueChange={(value) => setSeccionActiva(value as "venta" | "recientes")}>
            <TabsList>
              <TabsTrigger value="venta">
                <Tag className="mr-2 h-4 w-4" />
                Venta Actual
              </TabsTrigger>
              <TabsTrigger value="recientes">
                <Clock className="mr-2 h-4 w-4" />
                Ventas Recientes
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" onClick={nuevaVenta}>
            <FilePlus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Button>
        </div>
      </div>

      {seccionActiva === "recientes" ? (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Ventas Recientes</CardTitle>
            <CardDescription>Últimas 5 ventas registradas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Venta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasRecientes.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell className="font-medium">{venta.id}</TableCell>
                    <TableCell>{venta.fecha}</TableCell>
                    <TableCell>{venta.cliente}</TableCell>
                    <TableCell className="text-right">${venta.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {venta.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : mostrarFactura && ventaCompletada ? (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Factura #{numeroFactura}</CardTitle>
              <CardDescription>Fecha: {new Date().toLocaleDateString()}</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setMostrarFactura(false)}>
              Volver a Venta
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Datos del Cliente:</h3>
              {getClienteSeleccionado() ? (
                <div>
                  <p>
                    <strong>Nombre:</strong> {getClienteSeleccionado()?.nombre}
                  </p>
                  <p>
                    <strong>Email:</strong> {getClienteSeleccionado()?.email}
                  </p>
                  <p>
                    <strong>Teléfono:</strong> {getClienteSeleccionado()?.telefono}
                  </p>
                  {getClienteSeleccionado()?.esDeportista && <Badge className="mt-1">Deportista</Badge>}
                </div>
              ) : (
                <p>Cliente no registrado</p>
              )}
            </div>

            <h3 className="font-semibold mb-2">Detalle de Compra:</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carrito.map((item) => (
                  <TableRow key={item.producto.id}>
                    <TableCell className="font-mono text-xs">{item.producto.codigo}</TableCell>
                    <TableCell>{item.producto.nombre}</TableCell>
                    <TableCell className="text-right">${item.producto.precio.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.cantidad}</TableCell>
                    <TableCell className="text-right">${item.subtotal.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              {aplicarDescuento && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({porcentajeDescuento}%):</span>
                  <span>-${descuento.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA (19%):</span>
                <span>${iva.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Método de Pago:</span>
                <span className="capitalize">{metodoPago}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-gray-500">Gracias por su compra</p>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Factura
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Panel izquierdo: Búsqueda y selección de productos */}
          <div className="md:col-span-8">
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Registro de Artículos</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVistaProductos("grid")}
                      className={vistaProductos === "grid" ? "bg-muted" : ""}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVistaProductos("list")}
                      className={vistaProductos === "list" ? "bg-muted" : ""}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>Escanea el código o busca productos por nombre</CardDescription>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Buscar productos..."
                      className="pl-8"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <div className="px-4 pb-2 overflow-auto">
                <div className="flex space-x-2 pb-3 overflow-x-auto">
                  {categorias.map((categoria) => (
                    <Button
                      key={categoria}
                      variant={categoriaActiva === categoria ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoriaActiva(categoria)}
                      className="whitespace-nowrap"
                    >
                      {categoria}
                    </Button>
                  ))}
                </div>
              </div>

              <CardContent>
                <div className="border rounded-md p-4 mb-4 bg-gray-50">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="codigo-producto" className="block mb-2">
                        Escanear o ingresar código de producto
                      </Label>
                      <Input
                        id="codigo-producto"
                        placeholder="Código del producto..."
                        value={codigoProducto}
                        onChange={(e) => setCodigoProducto(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="w-20">
                      <Label htmlFor="cantidad-producto" className="block mb-2">
                        Cantidad
                      </Label>
                      <Input
                        id="cantidad-producto"
                        type="number"
                        min="1"
                        value={cantidadManual}
                        onChange={(e) => setCantidadManual(Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <Button onClick={buscarPorCodigo}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>

                  {ultimoProductoEscaneado && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        <span>
                          Agregado: <strong>{ultimoProductoEscaneado.nombre}</strong> - $
                          {ultimoProductoEscaneado.precio.toLocaleString()} x {cantidadManual}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {vistaProductos === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {productosFiltrados.map((producto) => (
                      <Card key={producto.id} className={cn("overflow-hidden", producto.stock === 0 && "opacity-60")}>
                        <div className="bg-gray-100 h-20 flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-gray-400" />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{producto.nombre}</h3>
                            <Badge variant="outline" className="ml-1 text-xs whitespace-nowrap font-mono">
                              {producto.codigo}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <span className="font-bold">${producto.precio.toLocaleString()}</span>
                            <Badge
                              variant={
                                producto.stock > 10 ? "outline" : producto.stock === 0 ? "destructive" : "secondary"
                              }
                            >
                              Stock: {producto.stock}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Input
                              type="number"
                              min="1"
                              defaultValue="1"
                              className="text-center"
                              onChange={(e) => setCantidadManual(Number.parseInt(e.target.value) || 1)}
                            />
                            <Button
                              className="w-full"
                              size="sm"
                              onClick={() => agregarAlCarrito(producto, cantidadManual)}
                              disabled={producto.stock === 0}
                            >
                              <Plus className="mr-1 h-4 w-4" /> Añadir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productosFiltrados.map((producto) => (
                          <TableRow key={producto.id}>
                            <TableCell className="font-mono text-xs">{producto.codigo}</TableCell>
                            <TableCell>{producto.nombre}</TableCell>
                            <TableCell>{producto.categoria}</TableCell>
                            <TableCell className="text-right">${producto.precio.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  producto.stock > 10 ? "outline" : producto.stock === 0 ? "destructive" : "secondary"
                                }
                              >
                                {producto.stock}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  defaultValue="1"
                                  className="w-16 text-center"
                                  onChange={(e) => setCantidadManual(Number.parseInt(e.target.value) || 1)}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => agregarAlCarrito(producto, cantidadManual)}
                                  disabled={producto.stock === 0}
                                >
                                  <Plus className="mr-1 h-4 w-4" /> Añadir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho: Carrito y finalización de venta */}
          <div className="md:col-span-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Detalle de Venta
                  <Badge className="ml-2" variant="outline">
                    {totalArticulos} {totalArticulos === 1 ? "artículo" : "artículos"}
                  </Badge>
                </CardTitle>

                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant={mostrarBusquedaCliente ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setMostrarBusquedaCliente(!mostrarBusquedaCliente)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {clienteSeleccionado ? "Cliente seleccionado" : "Seleccionar Cliente"}
                  </Button>
                </div>

                {getClienteSeleccionado() && !mostrarBusquedaCliente && (
                  <div className="mt-2 p-2 border rounded-md bg-gray-50">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{getClienteSeleccionado()?.nombre}</p>
                        <p className="text-xs text-gray-500">{getClienteSeleccionado()?.email}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setClienteSeleccionado("")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {mostrarBusquedaCliente && (
                  <div className="mt-2">
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Buscar cliente..."
                        className="pl-8"
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                      />
                    </div>

                    {busquedaCliente && clientesFiltrados.length > 0 && (
                      <div className="border rounded-md overflow-hidden max-h-40 overflow-y-auto">
                        {clientesFiltrados.map((cliente) => (
                          <div
                            key={cliente.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                            onClick={() => {
                              setClienteSeleccionado(cliente.id)
                              setBusquedaCliente("")
                              setMostrarBusquedaCliente(false)
                            }}
                          >
                            <div>
                              <p className="font-medium">{cliente.nombre}</p>
                              <p className="text-xs text-gray-500">{cliente.email}</p>
                            </div>
                            {cliente.esDeportista && <Badge>Deportista</Badge>}
                          </div>
                        ))}
                      </div>
                    )}

                    {busquedaCliente && clientesFiltrados.length === 0 && (
                      <div className="p-2 text-center border rounded-md">
                        <p className="text-sm text-gray-500">No se encontraron clientes</p>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {carrito.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <ShoppingCart className="mx-auto h-12 w-12 mb-2 opacity-20" />
                    <p>El carrito está vacío</p>
                    <p className="text-sm">Añade productos para comenzar la venta</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cant.</TableHead>
                            <TableHead className="text-right">Subt.</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {carrito.map((item) => (
                            <TableRow key={item.producto.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.producto.nombre}</p>
                                  <p className="text-xs text-gray-500">${item.producto.precio.toLocaleString()}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => cambiarCantidad(item.producto.id, -1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    value={item.cantidad}
                                    onChange={(e) =>
                                      establecerCantidad(item.producto.id, Number.parseInt(e.target.value) || 1)
                                    }
                                    className="w-12 h-7 text-center mx-1 p-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => cambiarCantidad(item.producto.id, 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${item.subtotal.toLocaleString()}
                              </TableCell>
                              <TableCell className="w-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-500"
                                  onClick={() => eliminarDelCarrito(item.producto.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="pt-4 space-y-4">
                      <div className="border rounded-md p-3 bg-gray-50 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Subtotal:</span>
                          <span className="font-medium">${subtotal.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch id="descuento" checked={aplicarDescuento} onCheckedChange={setAplicarDescuento} />
                          <Label htmlFor="descuento" className="text-sm">
                            Aplicar descuento
                          </Label>
                          {aplicarDescuento && (
                            <Select
                              value={porcentajeDescuento.toString()}
                              onValueChange={(value) => setPorcentajeDescuento(Number.parseInt(value))}
                            >
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue placeholder="%" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5%</SelectItem>
                                <SelectItem value="10">10%</SelectItem>
                                <SelectItem value="15">15%</SelectItem>
                                <SelectItem value="20">20%</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {aplicarDescuento && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Descuento:</span>
                            <span>-${descuento.toLocaleString()}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm">
                          <span>IVA (19%):</span>
                          <span>${iva.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                          <span>Total:</span>
                          <span>${total.toLocaleString()}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="block mb-2 text-sm">Método de Pago</Label>
                        <Tabs value={metodoPago} onValueChange={setMetodoPago} className="w-full">
                          <TabsList className="grid grid-cols-3 w-full">
                            <TabsTrigger value="efectivo">
                              <DollarSign className="mr-1 h-4 w-4" />
                              Efectivo
                            </TabsTrigger>
                            <TabsTrigger value="tarjeta">
                              <CreditCard className="mr-1 h-4 w-4" />
                              Tarjeta
                            </TabsTrigger>
                            <TabsTrigger value="transferencia">
                              <Receipt className="mr-1 h-4 w-4" />
                              Transf.
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <Button className="w-full" size="lg" onClick={completarVenta}>
                        <Save className="mr-2 h-4 w-4" />
                        Completar Venta
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
