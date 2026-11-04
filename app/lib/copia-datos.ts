// L6: copia de los datos de un titular (derecho de acceso). Convierte la respuesta de
// GET /api/personas/{id}/copia-datos a CSV (abre en Excel) y a un HTML imprimible (PDF desde el navegador).

export interface SeccionCopia {
  titulo: string;
  columnas: string[];
  filas: string[][];
}

export interface CopiaDatos {
  titular: string;
  generadoEn: string;
  secciones: SeccionCopia[];
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Celda CSV: comillas dobles escapadas y protegida contra fórmulas (=, +, -, @) al abrir en Excel. */
export function celdaCsv(v: string): string {
  let t = v ?? "";
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return `"${t.replace(/"/g, '""')}"`;
}

export function copiaACsv(c: CopiaDatos): string {
  const lineas: string[] = [];
  lineas.push(celdaCsv(`Copia de datos de ${c.titular}`));
  lineas.push(celdaCsv(`Generada: ${c.generadoEn}`));
  for (const s of c.secciones) {
    lineas.push("");
    lineas.push(celdaCsv(s.titulo));
    lineas.push(s.columnas.map(celdaCsv).join(","));
    if (s.filas.length === 0) lineas.push(celdaCsv("(sin registros)"));
    for (const f of s.filas) lineas.push(f.map(celdaCsv).join(","));
  }
  return "﻿" + lineas.join("\r\n"); // BOM para que Excel lea bien las tildes
}

export function copiaAHtml(c: CopiaDatos): string {
  const secciones = c.secciones
    .map((s) => {
      const cuerpo =
        s.filas.length === 0
          ? `<tr><td colspan="${Math.max(1, s.columnas.length)}"><i>Sin registros</i></td></tr>`
          : s.filas.map((f) => `<tr>${f.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("");
      return `<h2>${esc(s.titulo)}</h2><table><thead><tr>${s.columnas
        .map((x) => `<th>${esc(x)}</th>`)
        .join("")}</tr></thead><tbody>${cuerpo}</tbody></table>`;
    })
    .join("\n");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Copia de datos - ${esc(c.titular)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;margin:24px 32px;color:#111}
h1{font-size:15pt;margin:0 0 4px} h2{font-size:12pt;margin:18px 0 6px;border-bottom:1px solid #999}
.sub{color:#555;font-size:9pt;margin-bottom:10px}
table{border-collapse:collapse;width:100%;margin-bottom:6px} th,td{border:1px solid #bbb;padding:3px 6px;text-align:left;vertical-align:top} th{background:#eee}
@media print{body{margin:0}.noprint{display:none}}
</style></head><body>
<button class="noprint" onclick="window.print()">Imprimir / Guardar como PDF</button>
<h1>Copia de datos personales de ${esc(c.titular)}</h1>
<div class="sub">Generada el ${esc(c.generadoEn)} · Documento confidencial: contiene datos personales y de salud. Entrégalo solo al titular o a su representante legal, previa verificación de identidad.</div>
${secciones}
</body></html>`;
}

export function descargarCsv(c: CopiaDatos): void {
  const blob = new Blob([copiaACsv(c)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `copia-datos-${c.titular.replace(/[^\w]+/g, "-").toLowerCase()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function abrirImpresionCopia(c: CopiaDatos): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(copiaAHtml(c));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}
