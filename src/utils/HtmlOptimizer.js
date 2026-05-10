/**
 * HtmlOptimizer — Pós-processador do HTML final gerado pelo build.
 *
 * Consolida todas as tags <style> dos addons em um único bloco no <head>
 * e todas as tags <script> inline em um único bloco antes do </body>.
 *
 * Regras:
 *  - Apenas tags <style> sem atributo src são consolidadas (CSS inline).
 *  - Apenas tags <script> sem atributo src são consolidadas (JS inline).
 *  - Tags <script src="..."> (externos) são mantidas no lugar.
 *  - A ordem dos blocos consolidados é preservada (primeira ocorrência primeiro).
 */

const STYLE_REGEX = /<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gi;
const SCRIPT_INLINE_REGEX = /<script(?:\s(?!src)[^>]*)?>[\s\S]*?<\/script>/gi;
const STYLE_CONTENT_REGEX = /<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/i;
const SCRIPT_CONTENT_REGEX = /<script(?:\s(?!src)[^>]*)?>([\s\S]*?)<\/script>/i;

/**
 * Consolida styles e scripts do HTML final.
 *
 * @param {string} html - O HTML final renderizado.
 * @returns {string} - O HTML otimizado.
 */
export function optimizeHtml(html) {
  const collectedStyles = [];
  const collectedScripts = [];

  // 1. Extrair e remover todos os blocos <style> inline
  html = html.replace(STYLE_REGEX, (match) => {
    const contentMatch = match.match(STYLE_CONTENT_REGEX);
    if (contentMatch && contentMatch[1].trim()) {
      collectedStyles.push(contentMatch[1].trim());
    }
    return ''; // Remove do lugar original
  });

  // 2. Extrair e remover todos os blocos <script> inline (sem src)
  html = html.replace(SCRIPT_INLINE_REGEX, (match) => {
    // Garante que não é um script externo (src="...")
    if (/src\s*=\s*["']/.test(match)) return match; // mantém no lugar
    const contentMatch = match.match(SCRIPT_CONTENT_REGEX);
    if (contentMatch && contentMatch[1].trim()) {
      collectedScripts.push(contentMatch[1].trim());
    }
    return ''; // Remove do lugar original
  });

  // 3. Injetar bloco único de <style> antes de </head>
  if (collectedStyles.length > 0) {
    const consolidatedStyle = `\n<style id="renderit-styles">\n${collectedStyles.join('\n\n/* --- */\n\n')}\n</style>\n`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${consolidatedStyle}</head>`);
    } else {
      // Fallback: prepend ao documento
      html = consolidatedStyle + html;
    }
  }

  // 4. Injetar bloco único de <script> antes de </body>
  if (collectedScripts.length > 0) {
    const consolidatedScript = `\n<script id="renderit-scripts">\n${collectedScripts.join('\n\n/* --- */\n\n')}\n</script>\n`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${consolidatedScript}</body>`);
    } else {
      // Fallback: append ao documento
      html = html + consolidatedScript;
    }
  }

  // 5. Limpar linhas em branco excessivas geradas pelas remoções
  html = html.replace(/\n{3,}/g, '\n\n');

  return html;
}
