"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Importación masiva de deportistas (CSV) y exportes de listados. Permisos: importar_deportistas / exportar_listados.

interface FilaInforme {
  numero: number;
  nombre: string;
  documento: string | null;
  estado: "OK" | "ERROR" | "IMPORTADA";
  errores: string[];
  avisos: string[];
}

interface Informe {
  soloValidacion: boolean;
  total: number;
  validas: number;
  conErrores: number;
  importadas: number;
  cupoDisponible: number | null;
  errores: string[];
  filas: FilaInforme[];
}

const GUIA: { columna: string; obligatoria: boolean; detalle: string }[] = [
  { columna: "nombre", obligatoria: true, detalle: "Nombres del deportista" },
  { columna: "apellidos", obligatoria: true, detalle: "Apellidos del deportista" },
  { columna: "numero_documento", obligatoria: true, detalle: "Sin puntos ni espacios (si los trae, se quitan). No puede repetirse" },
  { columna: "fecha_nacimiento", obligatoria: true, detalle: "AAAA-MM-DD o DD/MM/AAAA" },
  { columna: "tipo_documento", obligatoria: false, detalle: "TI, RC, CC, CE, PA…" },
  { columna: "genero", obligatoria: false, detalle: "Como está en el sistema (p. ej. Femenino, Masculino)" },
  { columna: "estado", obligatoria: false, detalle: "Si se deja vacío queda Activo. No se importa en Retirado" },
  { columna: "nivel", obligatoria: false, detalle: "Nombre exacto de un nivel que ya exista en el club" },
  { columna: "convenio", obligatoria: false, detalle: "Nombre de un convenio que ya exista" },
  { columna: "altura / peso", obligatoria: false, detalle: "Números (altura en cm, peso en kg)" },
  { columna: "telefono, direccion, contacto_emergencia", obligatoria: false, detalle: "Texto libre" },
  {
    columna: "acudiente_nombre, acudiente_apellidos, acudiente_telefono, acudiente_email, acudiente_documento, acudiente_tipo_documento, acudiente_parentesco",
    obligatoria: false,
    detalle:
      "Acudiente principal. Si lo indicas: nombre, apellidos y un teléfono o correo son obligatorios. Con el mismo documento se reutiliza el acudiente (hermanos)",
  },
];

function descargar(datos: BlobPart, nombre: string) {
  const url = URL.createObjectURL(new Blob([datos], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Contenido() {
  const { permissions } = useUser();
  const puedeImportar = permissions.includes("importar_deportistas");
  const puedeExportar = permissions.includes("exportar_listados");

  const entrada = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [cargando, setCargando] = useState(false);
  const [soloProblemas, setSoloProblemas] = useState(true);

  async function bajar(url: string, nombre: string) {
    try {
      const { data } = await api.get(url, { responseType: "blob" });
      descargar(data, nombre);
    } catch (e) {
      toast.error("No se pudo descargar el archivo");
      console.error(e);
    }
  }

  async function enviar(ruta: string) {
    if (!archivo) return;
    setCargando(true);
    try {
      const datos = new FormData();
      datos.append("archivo", archivo);
      const { data } = await api.post<Informe>(ruta, datos);
      setInforme(data);
      return data;
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo procesar el archivo"));
    } finally {
      setCargando(false);
    }
  }

  async function revisar() {
    const r = await enviar("/api/importaciones/deportistas/validar");
    if (r && r.errores.length > 0 && r.filas.length === 0) {
      toast.error(r.errores[0]);
    }
  }

  async function importar() {
    const r = await enviar("/api/importaciones/deportistas");
    if (r) {
      if (r.importadas > 0) toast.success(`${r.importadas} deportista(s) importado(s)`);
      if (r.conErrores > 0) toast.warn(`${r.conErrores} fila(s) no se importaron: revisa el informe`);
    }
  }

  function elegir(f: File | null) {
    setArchivo(f);
    setInforme(null);
  }

  const filasMostradas = informe
    ? informe.filas.filter((f) => !soloProblemas || f.estado === "ERROR" || f.avisos.length > 0)
    : [];
  const yaImportado = informe !== null && !informe.soloValidacion;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Importar y exportar</h1>
        <p className="text-sm text-muted-foreground">
          Carga deportistas desde un archivo CSV y descarga los listados del club. Los archivos se abren y se guardan con Excel
          (Guardar como → CSV).
        </p>
      </div>

      {puedeExportar && (
        <Card>
          <CardHeader>
            <CardTitle>Exportar listados</CardTitle>
            <CardDescription>Datos personales de menores: úsalos solo para la gestión del club y guárdalos con cuidado.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => bajar("/api/exportes/deportistas", "deportistas.csv")}>
              <Download className="mr-2 h-4 w-4" /> Deportistas (CSV)
            </Button>
            <Button variant="outline" onClick={() => bajar("/api/exportes/acudientes", "acudientes.csv")}>
              <Download className="mr-2 h-4 w-4" /> Acudientes (CSV)
            </Button>
          </CardContent>
        </Card>
      )}

      {puedeImportar && (
        <Card>
          <CardHeader>
            <CardTitle>Importar deportistas</CardTitle>
            <CardDescription>
              1. Descarga la plantilla y llénala. 2. Revisa el archivo: no se guarda nada. 3. Importa las filas correctas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => bajar("/api/importaciones/deportistas/plantilla", "plantilla-deportistas.csv")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Descargar plantilla
              </Button>
              <input
                ref={entrada}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => elegir(e.target.files?.[0] ?? null)}
              />
              <Button variant="outline" onClick={() => entrada.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> {archivo ? "Cambiar archivo" : "Elegir archivo"}
              </Button>
              {archivo && <span className="text-sm text-muted-foreground">{archivo.name}</span>}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={revisar} disabled={!archivo || cargando}>
                {cargando ? "Procesando…" : "Revisar archivo"}
              </Button>
              <Button
                variant="default"
                onClick={importar}
                disabled={!archivo || cargando || !informe || yaImportado || informe.validas === 0}
              >
                {informe && !yaImportado ? `Importar ${informe.validas} fila(s) correcta(s)` : "Importar"}
              </Button>
            </div>

            {informe && (
              <div className="space-y-3">
                {informe.errores.map((m, i) => (
                  <p key={i} className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                    {m}
                  </p>
                ))}
                {informe.filas.length > 0 && (
                  <>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">{informe.total} filas</Badge>
                      {yaImportado ? (
                        <Badge>{informe.importadas} importadas</Badge>
                      ) : (
                        <Badge>{informe.validas} correctas</Badge>
                      )}
                      {informe.conErrores > 0 && <Badge variant="destructive">{informe.conErrores} con errores</Badge>}
                      {informe.cupoDisponible !== null && (
                        <span className="text-muted-foreground">Cupos libres del plan: {informe.cupoDisponible}</span>
                      )}
                    </div>
                    {yaImportado && informe.importadas > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Cada deportista queda con su usuario del portal sin clave conocida: entrégales una clave temporal desde Usuarios.
                        Los consentimientos no se importan; regístralos en Consentimientos.
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="solo-problemas"
                        checked={soloProblemas}
                        onCheckedChange={(v) => setSoloProblemas(v === true)}
                      />
                      <Label htmlFor="solo-problemas">Mostrar solo filas con errores o avisos</Label>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Fila</TableHead>
                          <TableHead>Deportista</TableHead>
                          <TableHead className="w-28">Resultado</TableHead>
                          <TableHead>Detalle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filasMostradas.map((f) => (
                          <TableRow key={f.numero}>
                            <TableCell>{f.numero}</TableCell>
                            <TableCell>
                              {f.nombre || "—"}
                              {f.documento && <span className="block text-xs text-muted-foreground">{f.documento}</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant={f.estado === "ERROR" ? "destructive" : "default"}>
                                {f.estado === "ERROR" ? "Error" : f.estado === "IMPORTADA" ? "Importada" : "Correcta"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {f.errores.map((m, i) => (
                                <p key={`e${i}`} className="text-destructive">
                                  {m}
                                </p>
                              ))}
                              {f.avisos.map((m, i) => (
                                <p key={`a${i}`} className="text-muted-foreground">
                                  {m}
                                </p>
                              ))}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filasMostradas.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                              No hay filas con errores ni avisos.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}
              </div>
            )}

            <div>
              <h2 className="mb-2 text-sm font-medium">Columnas de la plantilla</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Columna</TableHead>
                    <TableHead className="w-28">Obligatoria</TableHead>
                    <TableHead>Qué lleva</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GUIA.map((g) => (
                    <TableRow key={g.columna}>
                      <TableCell className="font-mono text-xs">{g.columna}</TableCell>
                      <TableCell>{g.obligatoria ? "Sí" : "No"}</TableCell>
                      <TableCell className="text-sm">{g.detalle}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-2 text-xs text-muted-foreground">
                Máximo 1.000 filas y 1 MB por archivo. Una fila con error no detiene a las demás: corrige solo esas filas y vuelve a
                cargarlas. Se respeta el límite de deportistas de tu plan.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!puedeImportar && !puedeExportar && (
        <p className="text-sm text-muted-foreground">Tu rol no tiene permiso para importar ni exportar. Pídeselo al administrador del club.</p>
      )}
    </div>
  );
}

export default function ImportarExportarPage() {
  return (
    <ProtectedRoute requiredPermission="ver_dash_personas">
      <Contenido />
    </ProtectedRoute>
  );
}
