// Los criterios de habilidades llegan como "N1-EST-GEN-ELI-01 · Serie de pasadas de arco atrás":
// el código (nomenclatura) y el nombre legible. En pantalla se muestra el nombre y el código queda de guía.

const SEPARADOR = " · ";

export function partirNombreCriterio(nombre: string | null | undefined): { codigo: string | null; texto: string } {
  const completo = nombre ?? "";
  const i = completo.indexOf(SEPARADOR);
  if (i <= 0) return { codigo: null, texto: completo };
  const codigo = completo.slice(0, i).trim();
  // Solo se trata como código si no tiene espacios (p. ej. "N1-EST-GEN-ELI-01"); así no se parte un nombre normal con "·".
  if (/\s/.test(codigo)) return { codigo: null, texto: completo };
  return { codigo, texto: completo.slice(i + SEPARADOR.length).trim() };
}
