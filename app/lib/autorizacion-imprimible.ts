// L4: formato imprimible de las tres autorizaciones de tratamiento de datos (texto de la sección 4 del documento
// legal, versión 2026-11) con los datos del deportista y del acudiente ya llenos. Se abre en una ventana aparte y
// se imprime / guarda como PDF desde el navegador. El texto lo debe validar un abogado antes de usarse.

export const VERSION_TEXTO_AUTORIZACION = "2026-11";

export interface DatosAutorizacion {
  club: string;
  deportista: {
    nombre: string; // nombre completo
    tipoDocumento?: string | null;
    numeroDocumento?: string | null;
    fechaNacimiento?: string | null; // yyyy-mm-dd
  };
  acudiente?: {
    nombre: string;
    tipoDocumento?: string | null;
    numeroDocumento?: string | null;
    parentesco?: string | null;
  } | null;
  /** Fecha de impresión (para pruebas); por defecto hoy. */
  hoy?: Date;
}

const LINEA = "______________________";

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Devuelve el valor escapado o una línea en blanco para llenar a mano. */
function llenar(v?: string | null): string {
  const t = (v ?? "").trim();
  return t ? `<u>${esc(t)}</u>` : LINEA;
}

export function esMenor(fechaNacimiento?: string | null, hoy: Date = new Date()): boolean | null {
  if (!fechaNacimiento) return null;
  const nac = new Date(fechaNacimiento + "T00:00:00");
  if (Number.isNaN(nac.getTime())) return null;
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad < 18;
}

function fechaLarga(f?: string | null): string {
  if (!f) return LINEA;
  const d = new Date(f + "T00:00:00");
  if (Number.isNaN(d.getTime())) return LINEA;
  return `<u>${d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</u>`;
}

function doc(tipo?: string | null, numero?: string | null): string {
  const t = `${(tipo ?? "").trim()} ${(numero ?? "").trim()}`.trim();
  return llenar(t);
}

function casillas(): string {
  return `<p class="casillas">☐ Sí autorizo &nbsp;&nbsp;&nbsp;&nbsp; ☐ No autorizo</p>`;
}

/** HTML completo (documento) de las autorizaciones. Función pura: no toca el DOM. */
export function construirHtmlAutorizaciones(d: DatosAutorizacion): string {
  const hoy = d.hoy ?? new Date();
  const menor = esMenor(d.deportista.fechaNacimiento, hoy);
  const esAdulto = menor === false;
  const club = d.club?.trim() ? `<u>${esc(d.club.trim())}</u>` : LINEA;
  const ac = d.acudiente;

  const quienAutoriza = esAdulto
    ? `<p><b>Datos de quien autoriza.</b> Yo, ${llenar(d.deportista.nombre)}, identificado(a) con ${doc(
        d.deportista.tipoDocumento,
        d.deportista.numeroDocumento,
      )}, nacido(a) el ${fechaLarga(d.deportista.fechaNacimiento)}, declaro que he sido informado(a) de lo que aquí se autoriza.</p>`
    : `<p><b>Datos de quien autoriza.</b> Yo, ${llenar(ac?.nombre)}, identificado(a) con ${doc(
        ac?.tipoDocumento,
        ac?.numeroDocumento,
      )}, en calidad de ${llenar(ac?.parentesco)} del deportista ${llenar(d.deportista.nombre)}, nacido(a) el ${fechaLarga(
        d.deportista.fechaNacimiento,
      )}, declaro que soy su representante legal y que lo he informado, según su edad y madurez, de lo que aquí se autoriza y he tenido en cuenta su opinión.</p>`;

  const sujeto = esAdulto ? "mis datos" : "los datos personales del deportista y los míos";
  const opinion = esAdulto
    ? ""
    : `<p><b>4. Opinión del menor.</b> El deportista fue escuchado según su madurez. Entiendo que puede pedir que se revise esta autorización cuando cumpla la mayoría de edad.</p>`;
  const firmante = esAdulto ? "del deportista" : "del acudiente";
  const advertencia =
    menor === null
      ? `<p class="aviso">Falta la fecha de nacimiento del deportista: no se pudo definir si es menor de edad. Regístrala en su ficha y vuelve a generar este formato.</p>`
      : "";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Autorización de tratamiento de datos - ${esc(d.deportista.nombre)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11.5pt; line-height: 1.4; margin: 24px 36px; color: #111; }
  h1 { font-size: 15pt; margin: 0 0 4px; }
  .sub { color: #555; font-size: 9.5pt; margin-bottom: 14px; }
  p { margin: 7px 0; text-align: justify; }
  .casillas { font-weight: bold; margin-left: 8px; }
  .firmas { margin-top: 36px; }
  .aviso { border: 1px solid #c2410c; padding: 6px; color: #9a3412; }
  u { text-decoration: underline; }
  @media print { body { margin: 0; } .noprint { display: none; } }
</style></head><body>
<button class="noprint" onclick="window.print()">Imprimir / Guardar como PDF</button>
<h1>Autorización de tratamiento de datos: ${esAdulto ? "salud e imagen" : "menores, salud e imagen"}</h1>
<div class="sub">Versión del texto ${VERSION_TEXTO_AUTORIZACION} · Impreso el ${hoy.toLocaleDateString("es-CO")}</div>
${advertencia}
${quienAutoriza}
<p><b>1. Responsable y finalidades.</b> El responsable es ${club}, NIT ${LINEA} (en adelante, “el Club”). Los datos se tratarán para: inscribir y matricular al deportista; formarlo en grupos y categorías; registrar asistencia, evaluaciones, objetivos y resultados; inscribirlo en competencias y ante la federación (${LINEA}); cobrar mensualidades, eventos y productos y enviar recordatorios de pago; comunicar avisos por el portal, correo o WhatsApp; y garantizar su seguridad. El Club usa el software CheerManager (VarCal Tech SAS) como encargado. La política de tratamiento del Club está disponible en ${LINEA}.</p>
<p><b>2. Autorización A — Datos personales</b> (TRATAMIENTO_DATOS)</p>
<p>Autorizo el tratamiento de ${sujeto} (identificación, contacto, fecha de nacimiento, género, nivel, asistencia, evaluaciones, pagos) para las finalidades del numeral 1.</p>
${casillas()}
<p><b>3. Autorización B — Datos de salud</b> (DATOS_SALUD, dato sensible)</p>
<p>Autorizo de forma explícita el tratamiento de los datos de salud ${esAdulto ? "" : "del deportista "}(historial médico, lesiones, alergias, medicación, EPS, contacto de emergencia) para cuidar su integridad, adaptar los entrenamientos y actuar ante una emergencia, incluida la comunicación con servicios de salud.</p>
<p>Entiendo que <b>no estoy obligado a autorizar</b> el tratamiento de datos sensibles. Si no lo autorizo, el Club no tendrá información médica del deportista y podrá pedirme otro soporte de aptitud para entrenar, por la seguridad de un deporte de alto impacto.</p>
${casillas()}
${opinion}
<p><b>${esAdulto ? "4" : "5"}. Autorización C — Imagen</b> (IMAGEN, opcional)</p>
<p>Autorizo al Club a tomar y usar fotos y videos ${esAdulto ? "míos" : "del deportista"} en entrenamientos, eventos y competencias para su memoria, redes sociales, página web y publicidad del Club, sin compensación. El Club no publicará junto a la imagen el documento, la dirección ni el teléfono ${esAdulto ? "" : "del menor "}ni imágenes que afecten su dignidad.</p>
<p>Esta autorización es voluntaria: <b>no autorizarla no afecta la participación del deportista</b> en el Club. Puedo revocarla en cualquier momento; el Club retirará lo publicado que dependa de él en un plazo razonable de ${LINEA} días, sin afectar lo ya difundido por terceros.</p>
${casillas()}
<p><b>${esAdulto ? "5" : "6"}. Con quién se comparten los datos.</b> Con la federación y los organizadores de las competencias en las que se inscriba al deportista (nombre, documento, fecha de nacimiento, categoría), con servicios de salud en una emergencia, con CheerManager como proveedor tecnológico y con autoridades cuando la ley lo exija.</p>
<p><b>${esAdulto ? "6" : "7"}. Mis derechos.</b> Puedo conocer, actualizar y rectificar los datos, pedir prueba de esta autorización, revocarla, pedir la supresión cuando proceda y presentar quejas ante la Superintendencia de Industria y Comercio, escribiendo a ${LINEA}.</p>
<p><b>${esAdulto ? "7" : "8"}. Prueba de la autorización.</b> El Club conserva este documento firmado y registra en CheerManager cada autorización como evidencia (tipo, versión del texto, fecha, canal y quien la otorgó). Una revocatoria se registra con su fecha y no borra el historial.</p>
<p><b>${esAdulto ? "8" : "9"}. Vigencia.</b> Mientras el deportista esté vinculado al Club y durante los plazos legales de conservación posteriores.</p>
<div class="firmas">
<p>Firma ${firmante}: ______________________________ &nbsp;&nbsp; Fecha: ______________</p>
<p>Firma de quien recibe por el Club: ______________________________</p>
</div>
</body></html>`;
}

/** Abre el formato en una ventana nueva y lanza el diálogo de impresión. Devuelve false si el navegador bloqueó la ventana. */
export function abrirImpresionAutorizaciones(d: DatosAutorizacion): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(construirHtmlAutorizaciones(d));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}
