"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/context/UserContext";
import { formatCOP, formatFecha } from "@/app/lib/facturas-pagos";
import SeccionCompetencia from "./SeccionCompetencia";
import SeccionSalud from "./SeccionSalud";
import type { EstadoVencimiento, PerfilDeportista as Perfil, VencimientoPerfil } from "@/app/lib/perfil-deportista";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const etiquetaMes = (yyyyMm: string) => MESES[Number(yyyyMm.slice(5, 7)) - 1] ?? yyyyMm;

const DOCUMENTO: Record<VencimientoPerfil["tipo"], string> = {
  CERTIFICADO_MEDICO: "Certificado médico",
  EPS: "EPS",
  SEGURO: "Seguro",
  LICENCIA: "Licencia de federación",
};

const ESTADO_DOC: Record<EstadoVencimiento, { texto: string; variante: "success" | "secondary" | "destructive" | "outline" }> = {
  VIGENTE: { texto: "Vigente", variante: "success" },
  POR_VENCER: { texto: "Por vencer", variante: "secondary" },
  VENCIDO: { texto: "Vencido", variante: "destructive" },
  SIN_REGISTRO: { texto: "Sin registro", variante: "outline" },
};

const ETIQUETA_CUENTA: Record<string, string> = {
  PAGADA: "Pagada",
  ABONO_PARCIAL: "Abono parcial",
  PENDIENTE: "Pendiente",
  EN_MORA: "En mora",
};

function Dato({ titulo, children, sub }: { titulo: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="text-xl font-semibold">{children}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SinDatos({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function antiguedad(meses: number | null) {
  if (meses === null) return "—";
  if (meses < 1) return "Menos de un mes";
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  return [a ? `${a} ${a === 1 ? "año" : "años"}` : null, m ? `${m} ${m === 1 ? "mes" : "meses"}` : null].filter(Boolean).join(" y ");
}

/**
 * Perfil 360 del deportista: estado, facturación, asistencia y evolución técnica. Lo usan la pantalla del club
 * (/deportistas/[id]) y la pestaña Resumen del portal (/mi). Las secciones que llegan null no se dibujan.
 * `modo` solo cambia los textos ("tú" en el portal); lo que se ve lo decide el back según permisos y reglas.
 */
export default function PerfilDeportista({ perfil, modo }: { perfil: Perfil; modo: "club" | "portal" }) {
  const { estado, facturacion, asistencia, evolucion, notaFacturacion } = perfil;
  const portal = modo === "portal";
  const { permissions } = useUser();
  // Cada sección se pide aparte y exige su propio permiso (el portal siempre las pide: el back valida que sea suyo).
  const verCompetencia = portal || permissions.includes("ver_evento");
  const verSalud = portal || permissions.includes("ver_lesiones");
  const activo = estado.estado === "Activo";

  return (
    <div className="space-y-4">
      {/* ---------- Estado ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {estado.nombre}
            <Badge variant={activo ? "success" : "secondary"}>{estado.estado ?? "Sin estado"}</Badge>
            {estado.nivel && <Badge variant="outline">Nivel {estado.nivel}</Badge>}
          </CardTitle>
          <CardDescription>
            {estado.grupos.length ? `Grupos: ${estado.grupos.join(", ")}` : "Sin grupo asignado"}
            {estado.edad !== null ? ` · ${estado.edad} años` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">En el club: </span>
              {antiguedad(estado.antiguedadMeses)}
              {estado.fechaRegistro ? ` (desde ${formatFecha(estado.fechaRegistro)})` : ""}
            </p>
            <p>
              <span className="text-muted-foreground">Plan de pago: </span>
              {estado.planPago ?? "—"}
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-medium">Documentos</p>
            {estado.vencimientos.length === 0 ? (
              <SinDatos>Sin documentos exigidos.</SinDatos>
            ) : (
              estado.vencimientos.map((v) => {
                const e = ESTADO_DOC[v.estado];
                return (
                  <div key={v.tipo} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{DOCUMENTO[v.tipo]}</span>
                    <span className="flex items-center gap-2">
                      {v.fechaVencimiento && (
                        <span className="text-xs text-muted-foreground">
                          {v.estado === "VENCIDO" ? "venció" : "vence"} {formatFecha(v.fechaVencimiento)}
                        </span>
                      )}
                      <Badge variant={e.variante}>{e.texto}</Badge>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---------- Indicadores ---------- */}
      {(asistencia || evolucion) && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 pt-6 lg:grid-cols-4">
            {asistencia && (
              <>
                <Dato
                  titulo="Asistencia del mes"
                  sub={`${asistencia.presentesMes} de ${asistencia.totalMes} sesiones`}
                >
                  {asistencia.porcentajeMes === null ? "—" : `${asistencia.porcentajeMes}%`}
                </Dato>
                <Dato titulo="Racha de asistencia" sub="sesiones seguidas">
                  {asistencia.rachaActual}
                </Dato>
              </>
            )}
            {evolucion && (
              <>
                <Dato titulo="Promedio de evaluaciones" sub={`${evolucion.evaluaciones} evaluaciones`}>
                  {evolucion.promedioGeneral ?? "—"}
                </Dato>
                <Dato
                  titulo="Habilidades dominadas"
                  sub={`${evolucion.habilidades.aprendidasAnio} aprendidas este año`}
                >
                  {evolucion.habilidades.dominadas}
                </Dato>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------- Facturación ---------- */}
      {facturacion ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Facturación</CardTitle>
            <CardDescription>
              {facturacion.proximoVencimiento
                ? `Próximo vencimiento: ${formatFecha(facturacion.proximoVencimiento)}`
                : "Sin vencimientos próximos"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Dato titulo="Saldo pendiente">{formatCOP(facturacion.saldoPendiente)}</Dato>
              <Dato titulo="Facturas en mora">
                <span className={facturacion.facturasEnMora ? "text-destructive" : ""}>{facturacion.facturasEnMora}</span>
              </Dato>
              <Dato titulo="Monto en mora">
                <span className={facturacion.montoEnMora ? "text-destructive" : ""}>{formatCOP(facturacion.montoEnMora)}</span>
              </Dato>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Por pagar</p>
              {facturacion.pendientes.length === 0 ? (
                <SinDatos>No hay facturas con saldo.</SinDatos>
              ) : (
                facturacion.pendientes.map((f) => (
                  <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                    <span>
                      <span className="font-medium">{f.numero}</span>
                      {f.descripcion ? ` · ${f.descripcion}` : ""}
                      {f.fechaVencimiento ? (
                        <span className="text-muted-foreground"> · vence {formatFecha(f.fechaVencimiento)}</span>
                      ) : null}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{formatCOP(f.saldo)}</span>
                      <Badge variant={f.estadoCuenta === "EN_MORA" ? "destructive" : "secondary"}>
                        {ETIQUETA_CUENTA[f.estadoCuenta ?? ""] ?? f.estadoCuenta}
                        {f.estadoCuenta === "EN_MORA" && f.diasMora ? ` · ${f.diasMora} d` : ""}
                      </Badge>
                    </span>
                  </div>
                ))
              )}
            </div>

            {facturacion.ultimosPagos && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Últimos pagos</p>
                {facturacion.ultimosPagos.length === 0 ? (
                  <SinDatos>Sin pagos registrados.</SinDatos>
                ) : (
                  facturacion.ultimosPagos.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>
                        {formatFecha(p.fecha)} · {p.numeroFactura ?? "—"}
                        {p.metodo ? ` · ${p.metodo}` : ""}
                      </span>
                      <span className="font-medium">{formatCOP(p.monto)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        notaFacturacion && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">{notaFacturacion}</CardContent>
          </Card>
        )
      )}

      {/* ---------- Asistencia ---------- */}
      {asistencia && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asistencia</CardTitle>
            <CardDescription>
              Últimos 90 días: {asistencia.porcentaje90d === null ? "sin sesiones" : `${asistencia.porcentaje90d}% de asistencia`}
              {asistencia.total90d > 0 &&
                ` (${asistencia.presentes90d} presente${asistencia.presentes90d === 1 ? "" : "s"}, ${asistencia.tardes90d} tarde${
                  asistencia.tardes90d === 1 ? "" : "s"
                }, ${asistencia.ausentes90d} ausente${asistencia.ausentes90d === 1 ? "" : "s"})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {asistencia.meses.some((m) => m.total > 0) ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={asistencia.meses.map((m) => ({ ...m, etiqueta: etiquetaMes(m.mes) }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="etiqueta" tickLine={false} fontSize={12} />
                    <YAxis domain={[0, 100]} unit="%" tickLine={false} fontSize={12} width={40} />
                    <RTooltip formatter={(v) => (v === null || v === undefined ? "Sin sesiones" : `${v}%`)} />
                    <Bar dataKey="porcentaje" name="Asistencia" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <SinDatos>Todavía no hay asistencias registradas en estos meses.</SinDatos>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------- Evolución técnica ---------- */}
      {evolucion && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Avance de habilidades</CardTitle>
              <CardDescription>
                {evolucion.habilidades.nivelEnCurso
                  ? `${portal ? "Estás" : "Está"} en ${evolucion.habilidades.nivelEnCurso}: ${evolucion.habilidades.avanceNivelEnCurso ?? 0}% de sus habilidades dominadas.`
                  : "Todavía no hay habilidades evaluadas."}
                {evolucion.posicion &&
                  evolucion.posicion.posicion !== null &&
                  ` Ranking ${evolucion.posicion.anio}: puesto ${evolucion.posicion.posicion} de ${evolucion.posicion.deportistasConAprendizaje} (${evolucion.posicion.aprendidas} aprendidas).`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {evolucion.habilidades.porNivel.map((n) => (
                  <div key={n.nivel} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{n.nivel}</span>
                      <span className="text-muted-foreground">
                        {n.dominadas} de {n.totalCatalogo} dominadas
                      </span>
                    </div>
                    <Progress value={n.porcentaje} className="h-2" />
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Habilidades aprendidas por mes</p>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolucion.aprendidasPorMes.map((m) => ({ ...m, etiqueta: etiquetaMes(m.mes) }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="etiqueta" tickLine={false} fontSize={12} />
                      <YAxis allowDecimals={false} tickLine={false} fontSize={12} width={28} />
                      <RTooltip />
                      <Bar dataKey="cantidad" name="Aprendidas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolución de las evaluaciones</CardTitle>
                <CardDescription>Promedio de los puntajes en cada fecha.</CardDescription>
              </CardHeader>
              <CardContent>
                {evolucion.serie.length >= 2 ? (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolucion.serie.map((p) => ({ fecha: `${p.fecha.slice(8, 10)}/${p.fecha.slice(5, 7)}`, promedio: p.promedio }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="fecha" tickLine={false} fontSize={12} />
                        <YAxis tickLine={false} fontSize={12} width={32} />
                        <RTooltip />
                        <Line type="monotone" dataKey="promedio" name="Promedio" stroke="hsl(var(--chart-3))" strokeWidth={2} dot />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <SinDatos>
                    {evolucion.serie.length === 1
                      ? "Con una sola fecha de evaluación aún no se ve la evolución."
                      : "Todavía no hay evaluaciones."}
                  </SinDatos>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Promedio por categoría</CardTitle>
                <CardDescription>Dónde {portal ? "estás" : "está"} más fuerte.</CardDescription>
              </CardHeader>
              <CardContent>
                {evolucion.porCategoria.length > 0 ? (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evolucion.porCategoria} layout="vertical" margin={{ left: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickLine={false} fontSize={12} />
                        <YAxis type="category" dataKey="categoria" tickLine={false} fontSize={12} width={100} />
                        <RTooltip />
                        <Bar dataKey="promedio" name="Promedio" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <SinDatos>Todavía no hay evaluaciones.</SinDatos>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ---------- Competencia y salud ---------- */}
      {verCompetencia && <SeccionCompetencia deportistaId={estado.deportistaId} modo={modo} />}
      {verSalud && <SeccionSalud deportistaId={estado.deportistaId} modo={modo} />}
    </div>
  );
}
