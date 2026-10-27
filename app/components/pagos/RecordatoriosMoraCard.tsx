"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BellRing, Eye, Loader2, Save, Send, MessageCircle, Mail, Monitor } from "lucide-react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { formatCOP } from "@/app/lib/facturas-pagos";

interface CanalesDisponibles {
  sistema: boolean;
  correo: boolean;
  whatsappApi: boolean;
}

interface Config {
  automatico: boolean;
  sistema: boolean;
  correo: boolean;
  whatsapp: boolean;
  diasEntreAvisos: number;
}

interface CanalAviso {
  canal: string;
  destino: string | null;
  estado: string;
  detalle: string | null;
}

interface Aviso {
  personaId: number;
  nombre: string;
  facturas: number;
  saldo: number;
  canales: CanalAviso[];
}

interface Resultado {
  simulacion: boolean;
  facturasEnMora: number;
  personas: number;
  omitidosPorFrecuencia: number;
  enviados: Record<string, number>;
  fallidos: Record<string, number>;
  avisos: Aviso[];
  enlacesWhatsapp: { nombre: string; telefono: string; url: string }[];
  advertencias: string[];
}

const ETIQUETA_CANAL: Record<string, string> = {
  SISTEMA: "Sistema",
  CORREO: "Correo",
  WHATSAPP: "WhatsApp",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  ENVIADO: "Enviado",
  FALLIDO: "Falló",
  SIN_DESTINO: "Sin destino",
  MANUAL: "Enlace manual",
  PROGRAMADO: "Se enviaría",
};

const sumar = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);

/**
 * Recordatorios de mora: elige por dónde avisar (el aviso dentro del sistema viene marcado), mira a quién
 * se avisaría (vista previa) y envía. También guarda el envío automático diario del club.
 */
export default function RecordatoriosMoraCard() {
  const [cargando, setCargando] = useState(true);
  const [disponibles, setDisponibles] = useState<CanalesDisponibles>({
    sistema: true,
    correo: false,
    whatsappApi: false,
  });
  const [sistema, setSistema] = useState(true);
  const [correo, setCorreo] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [forzar, setForzar] = useState(false);
  const [automatico, setAutomatico] = useState(false);
  const [dias, setDias] = useState("7");

  const [trabajando, setTrabajando] = useState<"" | "previa" | "envio" | "config" | "prueba">("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [correoPrueba, setCorreoPrueba] = useState("");

  useEffect(() => {
    Promise.allSettled([api.get("/api/recordatorios-mora/canales"), api.get("/api/recordatorios-mora/config")])
      .then(([rCanales, rConfig]) => {
        if (rCanales.status === "fulfilled") setDisponibles(rCanales.value.data);
        if (rConfig.status === "fulfilled") {
          const c: Config = rConfig.value.data;
          setSistema(c.sistema);
          setCorreo(c.correo);
          setWhatsapp(c.whatsapp);
          setAutomatico(c.automatico);
          setDias(String(c.diasEntreAvisos));
        }
      })
      .finally(() => setCargando(false));
  }, []);

  const cuerpo = () => ({ sistema, correo, whatsapp, forzar });
  const sinCanal = !sistema && !correo && !whatsapp;

  const ejecutar = async (simular: boolean) => {
    if (sinCanal) {
      toast.error("Elige al menos un canal");
      return;
    }
    setTrabajando(simular ? "previa" : "envio");
    try {
      const res = await api.post(
        simular ? "/api/recordatorios-mora/previsualizar" : "/api/recordatorios-mora/enviar",
        cuerpo(),
      );
      setResultado(res.data);
      if (!simular) {
        const ok = sumar(res.data.enviados);
        const mal = sumar(res.data.fallidos);
        if (ok > 0) toast.success(`Se enviaron ${ok} avisos${mal ? ` (${mal} fallaron)` : ""}`);
        else if (mal > 0) toast.error(`No se pudo enviar: ${mal} fallaron`);
        else toast.info("No había avisos por enviar");
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudieron procesar los recordatorios"));
    } finally {
      setTrabajando("");
    }
  };

  const confirmarEnvio = () => {
    if (!confirm("Se enviarán los recordatorios a las personas en mora por los canales elegidos. ¿Continuar?")) return;
    ejecutar(false);
  };

  const guardarConfig = async () => {
    setTrabajando("config");
    try {
      await api.put("/api/recordatorios-mora/config", {
        automatico,
        sistema,
        correo,
        whatsapp,
        diasEntreAvisos: Number(dias),
      });
      toast.success(automatico ? "Envío automático activado" : "Configuración guardada");
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo guardar la configuración"));
    } finally {
      setTrabajando("");
    }
  };

  const probarCorreo = async () => {
    setTrabajando("prueba");
    try {
      await api.post("/api/recordatorios-mora/probar-correo", { email: correoPrueba });
      toast.success("Correo de prueba enviado");
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo enviar el correo de prueba"));
    } finally {
      setTrabajando("");
    }
  };

  if (cargando) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <BellRing className="h-4 w-4" />
          Recordatorios de mora
        </CardTitle>
        <CardDescription>
          Avisa al deportista y a sus acudientes de las facturas vencidas, un solo mensaje por persona con todas sus
          facturas. No repite el aviso de la misma factura por el mismo canal antes de {dias || "7"} días.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Enviar por</p>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={sistema} onCheckedChange={(v) => setSistema(v === true)} className="mt-0.5" />
            <span>
              <span className="flex items-center gap-1 font-medium">
                <Monitor className="h-4 w-4" /> Dentro del sistema <Badge variant="secondary">Estándar</Badge>
              </span>
              <span className="text-muted-foreground">
                Aviso en el portal del deportista y de los acudientes que tengan usuario.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={correo}
              disabled={!disponibles.correo}
              onCheckedChange={(v) => setCorreo(v === true)}
              className="mt-0.5"
            />
            <span>
              <span className="flex items-center gap-1 font-medium">
                <Mail className="h-4 w-4" /> Correo
              </span>
              <span className="text-muted-foreground">
                {disponibles.correo
                  ? "A los correos del usuario del deportista y de sus acudientes."
                  : "No disponible: falta configurar el SMTP en el servidor."}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={whatsapp} onCheckedChange={(v) => setWhatsapp(v === true)} className="mt-0.5" />
            <span>
              <span className="flex items-center gap-1 font-medium">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </span>
              <span className="text-muted-foreground">
                {disponibles.whatsappApi
                  ? "Envío automático por WhatsApp Business."
                  : "Sin envío automático configurado: se generan enlaces para enviar cada mensaje a mano."}
              </span>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={forzar} onCheckedChange={(v) => setForzar(v === true)} />
            Incluir también a quienes ya se avisó hace poco
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => ejecutar(true)} disabled={trabajando !== "" || sinCanal}>
            {trabajando === "previa" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Eye className="h-4 w-4 mr-1" />
            )}
            Vista previa
          </Button>
          <Button size="sm" onClick={confirmarEnvio} disabled={trabajando !== "" || sinCanal}>
            {trabajando === "envio" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Enviar recordatorios
          </Button>
        </div>

        {resultado && (
          <div className="space-y-3 rounded-md border p-3 bg-muted/30 text-sm">
            <p>
              {resultado.simulacion ? "Vista previa: " : "Resultado: "}
              <strong>{resultado.facturasEnMora}</strong> facturas en mora de <strong>{resultado.personas}</strong>{" "}
              personas.
              {!resultado.simulacion && (
                <>
                  {" "}
                  Enviados: <strong>{sumar(resultado.enviados)}</strong>
                  {sumar(resultado.fallidos) > 0 && (
                    <>
                      {" "}
                      · Fallidos: <strong className="text-destructive">{sumar(resultado.fallidos)}</strong>
                    </>
                  )}
                  .
                </>
              )}
              {resultado.omitidosPorFrecuencia > 0 &&
                ` ${resultado.omitidosPorFrecuencia} se omitieron porque ya se avisó hace poco.`}
            </p>

            {resultado.advertencias.map((a, i) => (
              <p key={i} className="text-amber-600">
                {a}
              </p>
            ))}

            {resultado.avisos.length > 0 && (
              <ul className="space-y-2">
                {resultado.avisos.map((a) => (
                  <li key={a.personaId}>
                    <p className="font-medium">
                      {a.nombre}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {a.facturas} factura(s) · {formatCOP(a.saldo)}
                      </span>
                    </p>
                    <ul className="pl-4 text-muted-foreground">
                      {a.canales.map((c, i) => (
                        <li key={i}>
                          {ETIQUETA_CANAL[c.canal] ?? c.canal}
                          {c.destino ? ` → ${c.destino}` : ""}:{" "}
                          <span className={c.estado === "FALLIDO" ? "text-destructive" : ""}>
                            {ETIQUETA_ESTADO[c.estado] ?? c.estado}
                          </span>
                          {c.detalle ? ` (${c.detalle})` : ""}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}

            {resultado.enlacesWhatsapp.length > 0 && (
              <div>
                <p className="font-medium">WhatsApp: abre cada enlace y envía el mensaje</p>
                <ul className="list-disc pl-5">
                  {resultado.enlacesWhatsapp.map((e, i) => (
                    <li key={i}>
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline">
                        {e.nombre} ({e.telefono})
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Envío automático</p>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={automatico} onCheckedChange={(v) => setAutomatico(v === true)} />
            Enviar solo cada día a las 8:00 a.m. con los canales marcados arriba
          </label>
          <div className="flex items-end gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Días entre avisos de la misma factura</label>
              <Input
                type="number"
                min={1}
                max={90}
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                className="h-9 w-32"
              />
            </div>
            <Button variant="outline" size="sm" onClick={guardarConfig} disabled={trabajando !== ""}>
              {trabajando === "config" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Guardar
            </Button>
          </div>
          {disponibles.correo && (
            <div className="flex items-end gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs text-muted-foreground">Probar el correo del sistema</label>
                <Input
                  type="email"
                  placeholder="tu@correo.com"
                  value={correoPrueba}
                  onChange={(e) => setCorreoPrueba(e.target.value)}
                  className="h-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={probarCorreo} disabled={trabajando !== "" || !correoPrueba}>
                {trabajando === "prueba" && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Enviar correo de prueba
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
