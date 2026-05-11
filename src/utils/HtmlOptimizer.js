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
 * Consolida e minifica styles e scripts do HTML final.
 *
 * @param {string} html - O HTML final renderizado.
 * @returns {Promise<string>} - O HTML otimizado e minificado.
 */
export async function optimizeHtml(html) {
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

  // 3. Minificar e Injetar bloco único de <style>
  if (collectedStyles.length > 0) {
    let finalStyle = collectedStyles.join('\n');
    try {
      const { minify } = await import('https://esm.sh/csso@5.0.5');
      const result = minify(finalStyle);
      if (result.css) finalStyle = result.css;
    } catch (e) {
      console.warn('[HtmlOptimizer] CSS minification failed, using unminified.', e);
    }

    const consolidatedStyle = `\n<style id="renderit-styles">${finalStyle}</style>\n`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${consolidatedStyle}</head>`);
    } else {
      html = consolidatedStyle + html;
    }
  }

  // 4. Minificar e Injetar bloco único de <script>
  if (collectedScripts.length > 0) {
    let finalScript = collectedScripts.join('\n;\n');
    try {
      const { minify } = await import('https://esm.sh/terser@5.31.0');
      const result = await minify(finalScript, { compress: true, mangle: true });
      if (result.code) finalScript = result.code;
    } catch (e) {
      console.warn('[HtmlOptimizer] JS minification failed, using unminified.', e);
    }

    const consolidatedScript = `\n<script id="renderit-scripts">${finalScript}</script>\n`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${consolidatedScript}</body>`);
    } else {
      html = html + consolidatedScript;
    }
  }

  // 5. Limpar linhas em branco excessivas geradas pelas remoções
  html = html.replace(/\n{3,}/g, '\n\n');

  return html;
}
