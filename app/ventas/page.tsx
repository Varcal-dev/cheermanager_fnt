"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, ChevronsUpDown, Plus, Trash2, Loader2, Printer } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import React from "react";

interface Venta {
  id: number;
  fecha: string;
  total: number;
  metodoPago: string;
  personaId: number | null;
  nombreComprador: string;
  facturaId: number | null;
  numeroFactura: string | null;
  detalles: {
    productoVarianteId: number;
    skuVariante: string;
    nombreProducto: string;
    talla: string;
    color: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}

interface DeportistaOpcion {
  deportistaId: number;
  nombre: string;
  apellidos: string;
}

interface VarianteOpcion {
  id: number;
  productoId: number;
  nombreProducto: string;
  talla: string;
  color: string;
  skuVariante: string;
  precioVenta: number;
  stockActual: number | null;
}

interface ItemCarrito {
  productoVarianteId: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

function primerDiaDelMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

const COMPRADOR_INTERNO = "interno";
const COMPRADOR_EXTERNO = "externo";

export default function VentasPage() {
  const [cargando, setCargando] = useState(true);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoy());
  const [expandidas, setExpandidas] = useState<number[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoComprador, setTipoComprador] = useState(COMPRADOR_INTERNO);
  const [deportistas, setDeportistas] = useState<DeportistaOpcion[]>([]);
  const [variantes, setVariantes] = useState<VarianteOpcion[]>([]);
  const [personaId, setPersonaId] = useState("");
  const [nombreExterno, setNombreExterno] = useState("");
  const [contactoExterno, setContactoExterno] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [varianteParaAgregar, setVarianteParaAgregar] = useState("");
  const [buscadorProductoAbierto, setBuscadorProductoAbierto] = useState(false);
  const [cantidadParaAgregar, setCantidadParaAgregar] = useState("1");
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    api
      .get("/api/ventas", { params: { desde, hasta } })
      .then((res) => setVentas(res.data))
      .catch(() => toast.error("No se pudieron cargar las ventas"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  const toggleExpand = (id: number) => {
    setExpandidas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Comprobante imprimible para cualquier venta, tenga o no Factura contable
  // asociada (los compradores externos nunca la tienen, ver VentaService).
  // Se arma en una ventana aparte con su propio HTML/CSS en vez de reusar el
  // layout de la app, para no imprimir sidebar/nav ni pelear con el CSS
  // global — así el comprobante sale limpio en la impresora térmica o en PDF.
  const imprimirComprobante = (venta: Venta) => {
    const filas = venta.detalles
      .map(
        (d) => `
        <tr>
          <td>${d.nombreProducto}${
            [d.talla, d.color].filter(Boolean).length
              ? ` (${[d.talla, d.color].filter(Boolean).join(" / ")})`
              : ""
          }</td>
          <td class="num">${d.cantidad}</td>
          <td class="num">$${Number(d.precioUnitario).toLocaleString()}</td>
          <td class="num">$${Number(d.subtotal).toLocaleString()}</td>
        </tr>`,
      )
      .join("");

    const referencia = venta.numeroFactura
      ? `Factura ${venta.numeroFactura}`
      : `Comprobante de venta #${venta.id}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${referencia}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, Arial, sans-serif;
              max-width: 380px;
              margin: 0 auto;
              padding: 24px 16px;
              color: #111;
            }
            h1 { font-size: 16px; margin: 0 0 2px; }
            .sub { font-size: 12px; color: #555; margin-bottom: 16px; }
            .linea { display: flex; justify-content: space-between; font-size: 13px; margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
            th { text-align: left; border-bottom: 1px solid #333; padding: 4px 2px; font-size: 11px; text-transform: uppercase; }
            td { padding: 5px 2px; border-bottom: 1px dashed #ccc; vertical-align: top; }
            .num { text-align: right; white-space: nowrap; }
            .total { display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; margin-top: 14px; border-top: 1px solid #333; padding-top: 8px; }
            .footer { margin-top: 24px; font-size: 11px; color: #777; text-align: center; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Ratels All Stars</h1>
          <div class="sub">${referencia}</div>

          <div class="linea"><span>Fecha</span><span>${new Date(venta.fecha).toLocaleDateString()}</span></div>
          <div class="linea"><span>Comprador</span><span>${venta.nombreComprador}</span></div>
          <div class="linea"><span>Método de pago</span><span>${venta.metodoPago}</span></div>

          <table>
            <thead>
              <tr><th>Producto</th><th class="num">Cant.</th><th class="num">P. unit.</th><th class="num">Subtotal</th></tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>

          <div class="total"><span>Total</span><span>$${Number(venta.total).toLocaleString()}</span></div>

          <div class="footer">
            ${venta.numeroFactura ? "Factura registrada a la cuenta del deportista." : "Comprobante de venta — sin valor fiscal."}
          </div>
        </body>
      </html>`;

    const ventana = window.open("", "_blank", "width=420,height=650");
    if (!ventana) {
      toast.error("El navegador bloqueó la ventana de impresión. Permite pop-ups para este sitio.");
      return;
    }
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    // Pequeño delay para que el navegador termine de pintar antes de abrir
    // el diálogo de impresión (si no, a veces sale en blanco).
    setTimeout(() => ventana.print(), 300);
  };

  const abrirNuevaVenta = () => {
    setTipoComprador(COMPRADOR_INTERNO);
    setPersonaId("");
    setNombreExterno("");
    setContactoExterno("");
    setMetodoPago("Efectivo");
    setCarrito([]);
    setVarianteParaAgregar("");
    setCantidadParaAgregar("1");
    setModalAbierto(true);

    Promise.allSettled([
      api.get("/api/deportistas"),
      api.get("/api/productos/activos"),
    ]).then(([resDeportistas, resProductos]) => {
      if (resDeportistas.status === "fulfilled")
        setDeportistas(resDeportistas.value.data);
      if (resProductos.status === "fulfilled") {
        const todasLasVariantes: VarianteOpcion[] = [];
        const productosSinVariantes: string[] = [];
        for (const p of resProductos.value.data) {
          if (p.variantes && p.variantes.length > 0) {
            for (const v of p.variantes) {
              if (v.activo === false) continue;
              todasLasVariantes.push({
                id: v.id,
                productoId: p.id,
                nombreProducto: p.nombre,
                talla: v.talla,
                color: v.color,
                skuVariante: v.skuVariante,
                precioVenta: v.precioVenta,
                stockActual: v.stockActual,
              });
            }
          } else {
            // Antes esto agregaba una "variante" falsa usando el id del
            // Producto como si fuera un id de ProductoVariante real, con
            // stock tomado del campo cantidadStock (que nunca reflejaba el
            // inventario real). Vender con ese id rompía /api/ventas o, peor,
            // apuntaba a una variante distinta que coincidiera por número.
            // Un producto sin variantes simplemente no es vendible todavía.
            productosSinVariantes.push(p.nombre);
          }
        }
        if (productosSinVariantes.length > 0) {
          toast.warn(
            `${productosSinVariantes.length} producto(s) sin variantes no aparecen para venta: ${productosSinVariantes.join(", ")}. Agrégales una variante (talla/color) desde Inventario.`,
          );
        }
        setVariantes(todasLasVariantes);
      }
    });
  };

  const varianteSeleccionada = variantes.find(
    (v) => String(v.id) === varianteParaAgregar,
  );

  const agregarAlCarrito = () => {
    const variante = variantes.find(
      (v) => String(v.id) === varianteParaAgregar,
    );
    const cantidad = Number(cantidadParaAgregar);
    if (!variante) {
      toast.error("Selecciona un producto");
      return;
    }
    if (!cantidad || cantidad <= 0) {
      toast.error("Cantidad inválida");
      return;
    }
    const descripcion = `${variante.nombreProducto}${variante.talla ? ` - ${variante.talla}` : ""}${variante.color ? ` - ${variante.color}` : ""}`;
    setCarrito((prev) => [
      ...prev,
      {
        productoVarianteId: variante.id,
        descripcion,
        cantidad,
        precioUnitario: variante.precioVenta,
      },
    ]);
    setVarianteParaAgregar("");
    setCantidadParaAgregar("1");
  };

  const quitarDelCarrito = (index: number) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCarrito = carrito.reduce(
    (sum, i) => sum + i.cantidad * i.precioUnitario,
    0,
  );

  const guardarVenta = async () => {
    if (tipoComprador === COMPRADOR_INTERNO && !personaId) {
      toast.error("Selecciona el deportista comprador");
      return;
    }
    if (tipoComprador === COMPRADOR_EXTERNO && !nombreExterno.trim()) {
      toast.error("Ingresa el nombre del comprador externo");
      return;
    }
    if (carrito.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/api/ventas", {
        personaId:
          tipoComprador === COMPRADOR_INTERNO ? Number(personaId) : null,
        nombreCompradorExterno:
          tipoComprador === COMPRADOR_EXTERNO ? nombreExterno : null,
        contactoCompradorExterno:
          tipoComprador === COMPRADOR_EXTERNO ? contactoExterno : null,
        metodoPago,
        items: carrito.map((i) => ({
          productoVarianteId: i.productoVarianteId,
          cantidad: i.cantidad,
        })),
      });
      toast.success("Venta registrada");
      setModalAbierto(false);
      cargar();
    } catch (error: any) {
      // El backend responde 409 tanto para "comprador inválido" como para
      // "stock insuficiente" — el mensaje ya viene claro sobre cuál es.
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "No se pudo registrar la venta",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="ver_venta">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
            <p className="text-muted-foreground">
              Ventas de la tienda del club
            </p>
          </div>
          <Button onClick={abrirNuevaVenta}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Venta
          </Button>
        </div>

        <div className="flex gap-4 items-end">
          <div className="grid gap-1.5">
            <Label>Desde</Label>
            <Input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {cargando ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Método de pago</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No hay ventas en este rango de fechas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ventas.map((venta) => {
                      const estaExpandida = expandidas.includes(venta.id);
                      return (
                        <React.Fragment key={venta.id}>
                          <TableRow>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(venta.id)}
                              >
                                {estaExpandida ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              {new Date(venta.fecha).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {venta.nombreComprador}
                            </TableCell>
                            <TableCell>{venta.metodoPago}</TableCell>
                            <TableCell>
                              ${Number(venta.total).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {venta.facturaId ? (
                                <Badge variant="outline">
                                  {venta.numeroFactura ?? `Factura #${venta.facturaId}`}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Ver / imprimir comprobante"
                                onClick={() => imprimirComprobante(venta)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {estaExpandida && (
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={7} className="p-0">
                                <div className="p-4">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Talla/Color</TableHead>
                                        <TableHead>Cantidad</TableHead>
                                        <TableHead>Precio unitario</TableHead>
                                        <TableHead>Subtotal</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {venta.detalles.map((d, i) => (
                                        <TableRow key={i}>
                                          <TableCell>
                                            {d.nombreProducto}
                                          </TableCell>
                                          <TableCell>
                                            {[d.talla, d.color]
                                              .filter(Boolean)
                                              .join(" / ") || "—"}
                                          </TableCell>
                                          <TableCell>{d.cantidad}</TableCell>
                                          <TableCell>
                                            $
                                            {Number(
                                              d.precioUnitario,
                                            ).toLocaleString()}
                                          </TableCell>
                                          <TableCell>
                                            $
                                            {Number(
                                              d.subtotal,
                                            ).toLocaleString()}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Nueva venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4 overflow-y-auto flex-1">
            <Tabs value={tipoComprador} onValueChange={setTipoComprador}>
              <TabsList>
                <TabsTrigger value={COMPRADOR_INTERNO}>
                  Deportista del club
                </TabsTrigger>
                <TabsTrigger value={COMPRADOR_EXTERNO}>
                  Comprador externo
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {tipoComprador === COMPRADOR_INTERNO ? (
              <div className="grid gap-1.5">
                <Label>Deportista</Label>
                <Select value={personaId} onValueChange={setPersonaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un deportista" />
                  </SelectTrigger>
                  <SelectContent>
                    {deportistas.map((d) => (
                      <SelectItem
                        key={d.deportistaId}
                        value={String(d.deportistaId)}
                      >
                        {d.nombre} {d.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label>Nombre</Label>
                  <Input
                    value={nombreExterno}
                    onChange={(e) => setNombreExterno(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Contacto</Label>
                  <Input
                    value={contactoExterno}
                    onChange={(e) => setContactoExterno(e.target.value)}
                    placeholder="Teléfono o email"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label>Método de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 space-y-3">
              <Label>Productos</Label>
              <div className="flex gap-2">
                <Popover open={buscadorProductoAbierto} onOpenChange={setBuscadorProductoAbierto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={buscadorProductoAbierto}
                      className="flex-1 justify-between font-normal"
                    >
                      <span className="truncate">
                        {varianteSeleccionada ? (
                          <>
                            {varianteSeleccionada.nombreProducto}
                            {varianteSeleccionada.talla ? ` - ${varianteSeleccionada.talla}` : ""}
                            {varianteSeleccionada.color ? ` - ${varianteSeleccionada.color}` : ""} ($
                            {Number(varianteSeleccionada.precioVenta).toLocaleString()})
                          </>
                        ) : (
                          "Buscar producto..."
                        )}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Nombre, talla, color o SKU..." />
                      <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                          Sin resultados.
                        </CommandEmpty>
                        <CommandGroup>
                          {variantes.map((v) => {
                            const etiqueta = [v.nombreProducto, v.talla, v.color, v.skuVariante]
                              .filter(Boolean)
                              .join(" ");
                            return (
                              <CommandItem
                                key={v.id}
                                value={etiqueta}
                                onSelect={() => {
                                  setVarianteParaAgregar(String(v.id));
                                  setBuscadorProductoAbierto(false);
                                }}
                              >
                                <span className="truncate">
                                  {v.nombreProducto}
                                  {v.talla ? ` - ${v.talla}` : ""}
                                  {v.color ? ` - ${v.color}` : ""} ($
                                  {Number(v.precioVenta).toLocaleString()})
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  value={cantidadParaAgregar}
                  onChange={(e) => setCantidadParaAgregar(e.target.value)}
                />
                <Button variant="outline" onClick={agregarAlCarrito}>
                  Agregar
                </Button>
              </div>

              {carrito.length > 0 && (
                <Table>
                  <TableBody>
                    {carrito.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.descripcion}</TableCell>
                        <TableCell>x{item.cantidad}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-28"
                            value={item.precioUnitario}
                            onChange={(e) => {
                              const nuevoPrecio = Number(e.target.value);

                              setCarrito((prev) =>
                                prev.map((p, index) =>
                                  index === i
                                    ? {
                                        ...p,
                                        precioUnitario: nuevoPrecio,
                                      }
                                    : p,
                                ),
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => quitarDelCarrito(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {carrito.length > 0 && (
                <p className="text-right font-semibold">
                  Total: ${totalCarrito.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setModalAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button onClick={guardarVenta} disabled={guardando}>
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Registrar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}