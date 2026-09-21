/**
 * Utilitários de sanitização para evitar ataques de Cross-Site Scripting (XSS)
 * e injeção de CSS em componentes que usam HTML direto ou bibliotecas de terceiros (Leaflet).
 */

export function escapeHtml(unsafe?: string | null): string {
  if (typeof unsafe !== "string") return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeCssUrl(url?: string | null): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  // Bloquear esquemas perigosos como javascript: ou data:text/html
  if (
    trimmed.toLowerCase().startsWith("javascript:") ||
    trimmed.toLowerCase().startsWith("data:text/html")
  ) {
    return "";
  }
  // Escapar aspas simples e caracteres de quebra que poderiam fechar url('...')
  return trimmed.replace(/['"\\()]/g, "");
}
