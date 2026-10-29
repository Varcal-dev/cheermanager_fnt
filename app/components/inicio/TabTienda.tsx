"use client";

import { AlertTriangle, Layers, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResumenTienda } from "@/app/lib/dashboard";
import { formatCOP } from "@/app/lib/facturas-pagos";
import { type CargaPerezosa, KpiCard, MiniPieChart, PestanaResumen, SinDatos } from "./comunes";

/** Pestaña Tienda — /api/dashboard/tienda */
export default function TabTienda({ estado }: { estado: CargaPerezosa<ResumenTienda> }) {
  return (
    <PestanaResumen estado={estado} fallo="No se pudo cargar el resumen de tienda.">
      {(d) => (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              title="Ingreso del mes"
              value={formatCOP(d.ingresoMesActual)}
              description={`${d.ventasMesActual} ventas`}
              icon={<ShoppingBag className="h-5 w-5" />}
              tone="success"
              link="/ventas"
            />
            <KpiCard
              title="Unidades vendidas"
              value={String(d.unidadesVendidasMesActual)}
              description="mes en curso"
              icon={<Layers className="h-5 w-5" />}
              tone="primary"
              link="/inventario"
            />
            <KpiCard
              title="Variantes con stock bajo"
              value={String(d.variantesConStockBajo.length)}
              description="requieren reabastecimiento"
              icon={<AlertTriangle className="h-5 w-5" />}
              tone="destructive"
              link="/inventario"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ingreso por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <MiniPieChart data={d.ingresoPorCategoria} formatter={(v) => formatCOP(v)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top productos del mes</CardTitle>
              </CardHeader>
              <CardContent>
                {d.topProductosVendidos.length === 0 ? (
                  <SinDatos>Sin ventas registradas este mes.</SinDatos>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Unidades</TableHead>
                        <TableHead className="text-right">Ingreso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.topProductosVendidos.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{p.nombreProducto}</TableCell>
                          <TableCell className="text-right">{p.unidadesVendidas}</TableCell>
                          <TableCell className="text-right">{formatCOP(p.ingresoGenerado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {d.variantesConStockBajo.length > 0 && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-sm">Variantes con stock bajo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {d.variantesConStockBajo.map((v) => (
                  <Badge key={v.productoVarianteId} variant="destructive">
                    {v.nombreProducto} {v.talla ? `· ${v.talla}` : ""} {v.color ? `· ${v.color}` : ""} (
                    {v.stockActual})
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PestanaResumen>
  );
}
