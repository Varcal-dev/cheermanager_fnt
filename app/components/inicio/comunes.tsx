"use client";

import type React from "react";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Piezas compartidas por las pestañas del dashboard de inicio.

export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

/** Estado de una pestaña que se carga la primera vez que se abre. */
export interface CargaPerezosa<T> {
  data: T | null;
  cargando: boolean;
}

export function Cargando() {
  return (
    <div className="flex items-center justify-center py-10 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
    </div>
  );
}

export function SinDatos({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{children}</p>;
}

/** Muestra "cargando", el contenido o un mensaje de fallo según el estado de la carga. */
export function PestanaResumen<T>({
  estado,
  fallo,
  children,
}: {
  estado: CargaPerezosa<T>;
  fallo: string;
  children: (data: T) => React.ReactNode;
}) {
  if (estado.cargando) return <Cargando />;
  if (estado.data) return <>{children(estado.data)}</>;
  return <SinDatos>{fallo}</SinDatos>;
}

const KPI_TONES = {
  primary: "text-primary",
  success: "text-success",
  accent: "text-accent",
  destructive: "text-destructive",
} as const;

const KPI_BG = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
} as const;

export function KpiCard({
  title,
  value,
  description,
  icon,
  link,
  tone = "primary",
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  tone?: keyof typeof KPI_TONES;
}) {
  return (
    <Link href={link} className="block">
      <Card className={cn("lane-accent hover:shadow-md transition-shadow", KPI_TONES[tone])}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 pl-5">
          <CardTitle className="text-sm font-sans font-medium text-muted-foreground">{title}</CardTitle>
          <span className={cn("rounded-md p-1.5", KPI_BG[tone])}>{icon}</span>
        </CardHeader>
        <CardContent className="pl-5">
          <div className="text-3xl font-display font-bold text-foreground font-figures">{value}</div>
          <div className="flex items-center mt-1">
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const ALERT_TONES = {
  warning: "bg-primary/10 text-primary",
  error: "bg-destructive/10 text-destructive",
  info: "bg-accent/10 text-accent",
} as const;

export function AlertItem({
  title,
  description,
  type,
}: {
  title: string;
  description: string;
  type: "warning" | "info" | "error";
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className={cn("rounded-full p-2", ALERT_TONES[type])}>
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Pie chart pequeño y genérico para los mapas Record<string, number> que devuelven varios de los
// DTOs de dashboard (por estado, por género, por nivel, por categoría...).
export function MiniPieChart({
  data,
  formatter,
}: {
  data: Record<string, number>;
  formatter?: (v: number) => string;
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);

  if (entries.length === 0) {
    return <SinDatos>Sin datos suficientes.</SinDatos>;
  }

  const chartData = entries.map(([name, value]) => ({ name, value }));

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height={180}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={70}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <RTooltip formatter={(v: number) => (formatter ? formatter(v) : v)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 flex-1">
        {chartData.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs gap-2">
            <span className="flex items-center gap-1.5 truncate">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="font-medium shrink-0">{formatter ? formatter(d.value) : d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
