/**
 * Escapa un valor para insertarlo como TEXTO dentro de HTML armado a mano (por ejemplo, las ventanas de
 * impresión que se escriben con window.open + document.write). Esas ventanas heredan el origen de la app,
 * así que un valor sin escapar (nombre de producto, comprador, etc.) podría ejecutar código y leer el token.
 *
 * Acepta cualquier valor: null/undefined salen como cadena vacía y los números se convierten a texto.
 * Solo es válido para texto y atributos entre comillas; no sirve para URLs ni para código dentro de <script>.
 */
export function esc(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
