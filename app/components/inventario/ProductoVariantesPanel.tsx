"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, ArrowLeftRight, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface Variante {
  id: number;
  productoId: number;
  nombreProducto: string;
  talla: string;
  color: string;
  skuVariante: string;
  precioVenta: number;
  stockActual: number | null;
  activo: boolean;
}

interface Movimiento {
  id: number;
  productoVarianteId: number;
  skuVariante: string;
  tipo: string;
  cantidad: number;
  motivo: string;
  fecha: string;
  usuario: string;
}

const FORM_VARIANTE_VACIO = { talla: "", color: "", precioVenta: "", stockInicial: "" };
const FORM_MOVIMIENTO_VACIO = { tipo: "entrada", cantidad: "", motivo: "" };

export default function ProductoVariantesPanel({
  productoId,
  requiereControlStock,
}: {
  productoId: number;
  requiereControlStock: boolean;
}) {
  const [cargando, setCargando] = useState(true);
  const [variantes, setVariantes] = useState<Variante[]>([]);

  const [modalVarianteAbierto, setModalVarianteAbierto] = useState(false);
  const [formVariante, setFormVariante] = useState(FORM_VARIANTE_VACIO);
  const [guardandoVariante, setGuardandoVariante] = useState(false);

  const [varianteMovimientos, setVarianteMovimientos] = useState<Variante | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [formMovimiento, setFormMovimiento] = useState(FORM_MOVIMIENTO_VACIO);
  const [registrandoMovimiento, setRegistrandoMovimiento] = useState(false);

  const cargar = () => {
    setCargando(true);
    api
      .get(`/api/producto-variantes/producto/${productoId}`)
      .then((res) => setVariantes(res.data))
      .catch(() => toast.error("No se pudieron cargar las variantes"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId]);

  const guardarVariante = async () => {
    if (!formVariante.precioVenta) {
      toast.error("El precio de venta es obligatorio");
      return;
    }
    setGuardandoVariante(true);
    try {
      await api.post("/api/producto-variantes", {
        productoId,
        talla: formVariante.talla || null,
        color: formVariante.color || null,
        precioVenta: Number(formVariante.precioVenta),
        stockInicial: formVariante.stockInicial ? Number(formVariante.stockInicial) : 0,
      });
      toast.success("Variante creada");
      setModalVarianteAbierto(false);
      setFormVariante(FORM_VARIANTE_VACIO);
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo crear la variante",
      );
    } finally {
      setGuardandoVariante(false);
    }
  };

  const desactivar = async (id: number) => {
    if (!confirm("¿Desactivar esta variante? Dejará de estar disponible para venta.")) return;
    try {
      await api.delete(`/api/producto-variantes/${id}`);
      toast.success("Variante desactivada");
      cargar();
    } catch {
      toast.error("No se pudo desactivar la variante");
    }
  };

  const abrirMovimientos = (variante: Variante) => {
    setVarianteMovimientos(variante);
    setFormMovimiento(FORM_MOVIMIENTO_VACIO);
    setCargandoMovimientos(true);
    api
      .get(`/api/movimientos-inventario/variante/${variante.id}`)
      .then((res) => setMovimientos(res.data))
      .catch(() => toast.error("No se pudieron cargar los movimientos"))
      .finally(() => setCargandoMovimientos(false));
  };

  const registrarMovimiento = async () => {
    if (!varianteMovimientos || !formMovimiento.cantidad) {
      toast.error("La cantidad es obligatoria");
      return;
    }
    setRegistrandoMovimiento(true);
    try {
      await api.post("/api/movimientos-inventario", {
        productoVarianteId: varianteMovimientos.id,
        tipo: formMovimiento.tipo,
        cantidad: Number(formMovimiento.cantidad),
        motivo: formMovimiento.motivo,
      });
      toast.success("Movimiento registrado");
      setFormMovimiento(FORM_MOVIMIENTO_VACIO);
      abrirMovimientos(varianteMovimientos);
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo registrar el movimiento",
      );
    } finally {
      setRegistrandoMovimiento(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setModalVarianteAbierto(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Variante
        </Button>
      </div>

      {variantes.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground">
          Ninguna variante creada todavía (talla/color).
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Talla</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variantes.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{v.skuVariante}</TableCell>
                <TableCell>{v.talla ?? "—"}</TableCell>
                <TableCell>{v.color ?? "—"}</TableCell>
                <TableCell>${Number(v.precioVenta).toLocaleString()}</TableCell>
                <TableCell>
                  {requiereControlStock ? (
                    <Badge variant={(v.stockActual ?? 0) <= 5 ? "destructive" : "outline"}>
                      {v.stockActual ?? 0}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">No aplica</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={v.activo ? "default" : "secondary"}>
                    {v.activo ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {requiereControlStock && (
                      <Button variant="outline" size="sm" onClick={() => abrirMovimientos(v)}>
                        <ArrowLeftRight className="h-4 w-4 mr-1" /> Movimientos
                      </Button>
                    )}
                    {v.activo && (
                      <Button variant="destructive" size="sm" onClick={() => desactivar(v.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Desactivar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Nueva variante */}
      <Dialog open={modalVarianteAbierto} onOpenChange={setModalVarianteAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva variante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 grid gap-1.5">
                <Label>Talla</Label>
                <Input
                  value={formVariante.talla}
                  onChange={(e) => setFormVariante({ ...formVariante, talla: e.target.value })}
                  placeholder="Ej. M"
                />
              </div>
              <div className="flex-1 grid gap-1.5">
                <Label>Color</Label>
                <Input
                  value={formVariante.color}
                  onChange={(e) => setFormVariante({ ...formVariante, color: e.target.value })}
                  placeholder="Ej. Negro"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Precio de venta</Label>
              <Input
                type="number"
                value={formVariante.precioVenta}
                onChange={(e) => setFormVariante({ ...formVariante, precioVenta: e.target.value })}
              />
            </div>
            {requiereControlStock && (
              <div className="grid gap-1.5">
                <Label>Stock inicial</Label>
                <Input
                  type="number"
                  value={formVariante.stockInicial}
                  onChange={(e) =>
                    setFormVariante({ ...formVariante, stockInicial: e.target.value })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalVarianteAbierto(false)}
              disabled={guardandoVariante}
            >
              Cancelar
            </Button>
            <Button onClick={guardarVariante} disabled={guardandoVariante}>
              {guardandoVariante ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movimientos de una variante */}
      <Dialog
        open={!!varianteMovimientos}
        onOpenChange={(open) => !open && setVarianteMovimientos(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>
              Movimientos — {varianteMovimientos?.skuVariante}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
            <div className="flex gap-2 items-end border-b pb-4">
              <div className="grid gap-1.5">
                <Label>Tipo</Label>
                <Select
                  value={formMovimiento.tipo}
                  onValueChange={(v) => setFormMovimiento({ ...formMovimiento, tipo: v })}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="salida">Salida</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 w-[100px]">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={formMovimiento.cantidad}
                  onChange={(e) =>
                    setFormMovimiento({ ...formMovimiento, cantidad: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-1.5 flex-1">
                <Label>Motivo</Label>
                <Input
                  value={formMovimiento.motivo}
                  onChange={(e) =>
                    setFormMovimiento({ ...formMovimiento, motivo: e.target.value })
                  }
                  placeholder="Ej. Compra a proveedor"
                />
              </div>
              <Button onClick={registrarMovimiento} disabled={registrandoMovimiento}>
                {registrandoMovimiento ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Registrar"
                )}
              </Button>
            </div>

            {cargandoMovimientos ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
              </div>
            ) : movimientos.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Ningún movimiento registrado todavía.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{new Date(m.fecha).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.tipo === "entrada"
                              ? "default"
                              : m.tipo === "salida"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {m.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{m.cantidad}</TableCell>
                      <TableCell>{m.motivo}</TableCell>
                      <TableCell>{m.usuario}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter className="px-6 pb-6 pt-3 border-t">
            <Button variant="outline" onClick={() => setVarianteMovimientos(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}