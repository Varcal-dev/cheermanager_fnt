"use client";

import { AlertTriangle, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumenFinanzas } from "@/app/lib/dashboard";
import { formatCOP } from "@/app/lib/facturas-pagos";
import { type CargaPerezosa, KpiCard, PestanaResumen, SinDatos } from "./comunes";

/** Pestaña Financiero — /api/dashboard/finanzas */
export default function TabFinanciero({ estado }: { estado: CargaPerezosa<ResumenFinanzas> }) {
  return (
    <PestanaResumen estado={estado} fallo="No se pudo cargar el resumen financiero.">
      {(d) => (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Recaudo del mes"
              value={formatCOP(d.recaudoMesActual)}
              description={`facturado: ${formatCOP(d.facturadoMesActual)}`}
              icon={<DollarSign className="h-5 w-5" />}
              tone="success"
              link="/facturas"
            />
            <KpiCard
              title="Cartera pendiente"
              value={formatCOP(d.carteraPendienteTotal)}
              description={`${d.facturasConSaldoPendiente} facturas con saldo`}
              icon={<AlertTriangle className="h-5 w-5" />}
              tone="destructive"
              link="/facturas"
            />
            <KpiCard
              title="Ingreso tienda"
              value={formatCOP(d.ingresoTiendaMesActual)}
              description="ventas del mes en curso"
              icon={<ShoppingBag className="h-5 w-5" />}
              tone="accent"
              link="/ventas"
            />
            <KpiCard
              title="Facturado con descuento"
              value={formatCOP(d.ingresoConDescuentoMesActual)}
              description="referencia, no ahorro exacto"
              icon={<TrendingUp className="h-5 w-5" />}
              tone="primary"
              link="/descuentos"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recaudo mensual</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                {d.tendenciaUltimos6Meses.length === 0 ? (
                  <SinDatos>Todavía no hay historial suficiente.</SinDatos>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={d.tendenciaUltimos6Meses}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="mes" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <RTooltip formatter={(v: number) => formatCOP(v)} contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="recaudado" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Morosidad por plan</CardTitle>
                <CardDescription>% de facturas con saldo pendiente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.morosidadPorPlan.length === 0 ? (
                  <SinDatos>Sin planes con facturas todavía.</SinDatos>
                ) : (
                  d.morosidadPorPlan.map((p, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{p.nombrePlan}</span>
                        <span className="text-muted-foreground">
                          {p.porcentajeMorosidad != null ? `${p.porcentajeMorosidad.toFixed(0)}%` : "—"}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-destructive"
                          style={{ width: `${Math.min(p.porcentajeMorosidad ?? 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.facturasConSaldoPendiente} de {p.totalFacturas} facturas
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PestanaResumen>
  );
}
