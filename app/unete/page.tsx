"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/lib/api";

// Página pública "Únete": directorio de los clubes del sistema y la ficha de cada uno (sedes, grupos y horarios).
// Usa fetch y no el cliente `api`: es pública y no debe mandar al login ni arrastrar la sesión.
// Datos: GET /api/public/clubes y GET /api/public/clubes/{slug}.

interface ResumenClub {
  nombre: string;
  slug: string;
  totalGrupos: number;
  niveles: string[];
  ciudades: string[];
}
interface Horario {
  dia: string;
  inicio: string;
  fin: string;
}
interface Grupo {
  nombre: string;
  tipo: string | null;
  nivel: string | null;
  division: string | null;
  horarios: Horario[];
}
interface Sede {
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
}
interface Ficha {
  nombre: string;
  slug: string;
  sedes: Sede[];
  grupos: Grupo[];
}

const ORDEN_DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ordenDia = (d: string) => {
  const i = ORDEN_DIAS.indexOf(sinTildes(d));
  return i < 0 ? 99 : i;
};

async function pedir<T>(ruta: string): Promise<T> {
  const res = await fetch(`${API_URL}${ruta}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(res.status === 404 ? "No encontramos ese club." : "No se pudo cargar la información.");
  return res.json();
}

function Directorio() {
  const [clubes, setClubes] = useState<ResumenClub[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    pedir<ResumenClub[]>("/api/public/clubes")
      .then(setClubes)
      .catch((e: Error) => setError(e.message));
  }, []);

  const visibles = useMemo(() => {
    const q = sinTildes(busqueda.trim());
    return (clubes ?? []).filter(
      (c) => !q || sinTildes(`${c.nombre} ${c.ciudades.join(" ")} ${c.niveles.join(" ")}`).includes(q),
    );
  }, [clubes, busqueda]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Únete a un club</h1>
        <p className="text-muted-foreground">
          Conoce los clubes de cheerleading que usan CheerManager: dónde entrenan, qué grupos tienen y en qué horarios.
        </p>
      </div>

      <div className="relative flex w-full items-center sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por club, ciudad o nivel…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="h-11 pl-9 md:h-9"
        />
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!error && clubes === null && <p className="text-sm text-muted-foreground">Cargando clubes…</p>}
      {clubes !== null && visibles.length === 0 && (
        <p className="rounded-lg border bg-card py-10 text-center text-sm text-muted-foreground">
          {clubes.length === 0 ? "Aún no hay clubes publicados." : "Ningún club coincide con la búsqueda."}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {visibles.map((c) => (
          <li key={c.slug}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{c.nombre}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {c.ciudades.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {c.ciudades.join(", ")}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {c.totalGrupos} {c.totalGrupos === 1 ? "grupo" : "grupos"}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.niveles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.niveles.map((n) => (
                      <Badge key={n} variant="outline">{n}</Badge>
                    ))}
                  </div>
                )}
                <Button asChild className="max-sm:min-h-11 max-sm:w-full">
                  <Link href={`/unete?club=${encodeURIComponent(c.slug)}`}>Ver el club</Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FichaClub({ slug }: { slug: string }) {
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFicha(null);
    setError(null);
    pedir<Ficha>(`/api/public/clubes/${encodeURIComponent(slug)}`)
      .then(setFicha)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/unete">
          <ArrowLeft className="mr-1 h-4 w-4" /> Todos los clubes
        </Link>
      </Button>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!error && !ficha && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {ficha && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">{ficha.nombre}</h1>
              <p className="text-muted-foreground">Sedes, grupos y horarios de entrenamiento.</p>
            </div>
            {/* Formulario de solicitud (estático, ya existente): el club recibe tus datos como interesado. */}
            <Button asChild className="max-sm:min-h-11 max-sm:w-full">
              <a href={`/unete.html?club=${encodeURIComponent(ficha.slug)}`}>Quiero unirme</a>
            </Button>
          </div>

          <section aria-labelledby="sedes" className="space-y-2">
            <h2 id="sedes" className="font-display text-lg font-semibold">Sedes</h2>
            {ficha.sedes.length === 0 ? (
              <p className="text-sm text-muted-foreground">El club aún no ha publicado sus sedes.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {ficha.sedes.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border bg-card p-3 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="font-medium">{s.nombre}</span>
                      <span className="block text-xs text-muted-foreground">
                        {[s.direccion, s.ciudad].filter(Boolean).join(" · ") || "Sin dirección"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="grupos" className="space-y-2">
            <h2 id="grupos" className="font-display text-lg font-semibold">Grupos de entrenamiento</h2>
            {ficha.grupos.length === 0 ? (
              <p className="text-sm text-muted-foreground">El club aún no ha publicado sus grupos.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {ficha.grupos.map((g, i) => (
                  <li key={i}>
                    <Card className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{g.nombre}</CardTitle>
                        <div className="flex flex-wrap gap-1">
                          {g.tipo && <Badge variant="secondary">{g.tipo}</Badge>}
                          {g.nivel && <Badge variant="outline">{g.nivel}</Badge>}
                          {g.division && <Badge variant="outline">{g.division}</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {g.horarios.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Horario por confirmar.</p>
                        ) : (
                          <ul className="space-y-1 text-sm">
                            {[...g.horarios]
                              .sort((a, b) => ordenDia(a.dia) - ordenDia(b.dia) || a.inicio.localeCompare(b.inicio))
                              .map((h, j) => (
                                <li key={j} className="flex items-center gap-2">
                                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                                  {h.dia} · {h.inicio}–{h.fin}
                                </li>
                              ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Contenido() {
  const slug = (useSearchParams().get("club") ?? "").trim().toLowerCase();
  return slug ? <FichaClub slug={slug} /> : <Directorio />;
}

export default function UnetePage() {
  // useSearchParams exige Suspense.
  return (
    <div className="mx-auto max-w-4xl">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
        <Contenido />
      </Suspense>
    </div>
  );
}
