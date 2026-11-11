"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarGrupos, listarMiembros, type Grupo, type Miembro } from "@/app/lib/evaluaciones";
import { useUser } from "@/context/UserContext";
import { obtenerCarnet, obtenerFotoDeportista, subirFotoDeportista, verificarCarnet, type Carnet } from "@/app/lib/carnet";

// El back responde con `message` (errores generales) o `mensaje` (resultado de la subida de foto).
const mensajeError = (e: unknown, defecto: string) => {
  const data = (e as { response?: { data?: { message?: string; mensaje?: string } } })?.response?.data;
  return data?.message ?? data?.mensaje ?? defecto;
};

const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

/**
 * Foto del carnet. El endpoint exige sesión, así que se descarga como imagen y se muestra desde un blob local
 * (se libera al cambiar de carnet o desmontar). Sin foto, o sin permiso para verla, queda un círculo con iniciales.
 * `version` fuerza la recarga después de subir una foto nueva.
 */
function FotoCarnet({ c, version = 0 }: { c: Carnet; version?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!c.foto) { setUrl(null); return; }
    let activo = true;
    let objeto: string | null = null;
    obtenerFotoDeportista(c.deportistaId)
      .then((blob) => {
        if (!activo) return;
        objeto = URL.createObjectURL(blob);
        setUrl(objeto);
      })
      .catch(() => activo && setUrl(null));
    return () => {
      activo = false;
      if (objeto) URL.revokeObjectURL(objeto);
    };
  }, [c.deportistaId, c.foto, version]);

  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`Foto de ${c.nombre}`} className="h-28 w-28 rounded-full border-2 object-cover" />
  ) : (
    <div
      aria-label="Sin foto"
      className="flex h-28 w-28 items-center justify-center rounded-full border-2 bg-muted text-3xl font-bold text-muted-foreground"
    >
      {iniciales(c.nombre) || "?"}
    </div>
  );
}

function TarjetaCarnet({ c, version }: { c: Carnet; version?: number }) {
  return (
    <div id="carnet-imprimible" className="w-80 rounded-xl border-2 p-4 space-y-3 bg-card">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.club}</div>
        <div className="text-lg font-bold">{c.nombre}</div>
      </div>
      <div className="flex justify-center">
        <FotoCarnet c={c} version={version} />
      </div>
      <div className="flex justify-center">
        <QRCodeSVG value={c.codigo} size={180} level="M" marginSize={2} bgColor="#ffffff" fgColor="#000000" />
      </div>
      <div className="text-center text-sm">{c.grupos.length ? c.grupos.join(" · ") : "Sin grupo"}</div>
      <div className="flex justify-center">
        <Badge className={c.vigente ? "bg-green-600 text-white" : "bg-red-600 text-white"}>{c.estado}</Badge>
      </div>
    </div>
  );
}

function Generar() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [grupo, setGrupo] = useState("");
  const [carnet, setCarnet] = useState<Carnet | null>(null);
  const [versionFoto, setVersionFoto] = useState(0);
  const [subiendo, setSubiendo] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const { permissions } = useUser();
  const puedeSubirFoto = permissions.includes("modificar_deportista");
  useEffect(() => { listarGrupos().then(setGrupos).catch(() => toast.error("No se pudieron cargar los grupos")); }, []);
  const elegirGrupo = (v: string) => {
    setGrupo(v); setCarnet(null);
    listarMiembros(Number(v)).then(setMiembros).catch(() => toast.error("No se pudieron cargar los deportistas"));
  };
  const elegirDeportista = (v: string) =>
    obtenerCarnet(Number(v)).then(setCarnet).catch((e) => toast.error(mensajeError(e, "No se pudo generar el carnet")));

  async function alElegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo || !carnet) return;
    if (!archivo.type.startsWith("image/")) return toast.error("El archivo debe ser una imagen (JPEG, PNG, GIF o WebP)");
    if (archivo.size > 5 * 1024 * 1024) return toast.error("La foto no puede pesar más de 5 MB");
    setSubiendo(true);
    try {
      await subirFotoDeportista(carnet.deportistaId, archivo);
      // El carnet trae la ruta de la foto; se vuelve a pedir para que `foto` deje de ser null y la imagen se recargue.
      setCarnet(await obtenerCarnet(carnet.deportistaId));
      setVersionFoto((v) => v + 1);
      toast.success("Foto guardada");
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo guardar la foto"));
    } finally {
      setSubiendo(false);
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={grupo} onValueChange={elegirGrupo}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Grupo" /></SelectTrigger>
          <SelectContent>{grupos.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.nombre}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={elegirDeportista} disabled={!grupo}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Deportista" /></SelectTrigger>
          <SelectContent>{miembros.map((m) => <SelectItem key={m.deportistaId} value={String(m.deportistaId)}>{m.nombre}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {carnet && (
        <div className="space-y-3">
          <TarjetaCarnet c={carnet} version={versionFoto} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>Imprimir carnet</Button>
            {puedeSubirFoto && (
              <>
                <Button variant="outline" disabled={subiendo} onClick={() => entrada.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" />
                  {subiendo ? "Subiendo…" : carnet.foto ? "Cambiar foto" : "Subir foto"}
                </Button>
                <input
                  ref={entrada}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={alElegirFoto}
                />
              </>
            )}
          </div>
          <style>{`@media print { body * { visibility: hidden } #carnet-imprimible, #carnet-imprimible * { visibility: visible } #carnet-imprimible { position: fixed; left: 20px; top: 20px } }`}</style>
        </div>
      )}
    </div>
  );
}

function Verificar() {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<Carnet | null>(null);
  const [error, setError] = useState("");
  const verificar = async () => {
    setError(""); setResultado(null);
    try {
      setResultado(await verificarCarnet(codigo.trim()));
    } catch (e) {
      setError(mensajeError(e, "No se pudo verificar el carnet"));
    }
  };
  return (
    <div className="space-y-4 max-w-md">
      <p className="text-sm text-muted-foreground">
        Escanee el QR con un lector (o la cámara del teléfono) y pegue el código aquí. Un lector USB escribe el código y
        pulsa Enter.
      </p>
      <div className="flex gap-2">
        <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="CM1.…" autoFocus
          onKeyDown={(e) => e.key === "Enter" && codigo.trim() && verificar()} />
        <Button onClick={verificar} disabled={!codigo.trim()}>Verificar</Button>
      </div>
      {error && <p className="rounded-md border border-red-500 p-3 text-sm text-red-600">{error}</p>}
      {resultado && (
        <div className={`flex items-center gap-4 rounded-md border-2 p-4 ${resultado.vigente ? "border-green-600" : "border-red-600"}`}>
          <FotoCarnet c={resultado} />
          <div className="space-y-1">
          <div className="text-lg font-bold">{resultado.nombre}</div>
          <div className="text-sm">{resultado.grupos.join(" · ") || "Sin grupo"}</div>
          <Badge className={resultado.vigente ? "bg-green-600 text-white" : "bg-red-600 text-white"}>{resultado.estado}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CarnetPantalla() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carnet digital</h1>
        <p className="text-muted-foreground">Credencial con QR firmado por deportista, e impresión. Verifique un código escaneado.</p>
      </div>
      <Tabs defaultValue="generar">
        <TabsList>
          <TabsTrigger value="generar">Generar</TabsTrigger>
          <TabsTrigger value="verificar">Verificar</TabsTrigger>
        </TabsList>
        <TabsContent value="generar" className="pt-4"><Generar /></TabsContent>
        <TabsContent value="verificar" className="pt-4"><Verificar /></TabsContent>
      </Tabs>
    </div>
  );
}