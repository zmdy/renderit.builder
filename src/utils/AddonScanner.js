/**
 * Utilitário para escanear templates em busca de tags ADDON.
 */

/**
 * Escaneia o template e retorna uma lista de objetos com nome e src dos addons detectados.
 * 
 * @param {string} template 
 * @returns {{name: string, src: string|null}[]}
 */
export function scanTemplate(template) {
  if (!template) return [];
  const matches = template.match(/%ADDON\s+([^%]+)%/g) || [];
  
  return matches.map(match => {
    const tagContent = match.slice(1, -1).trim(); // Remove % and %
    const contentWithoutAddon = tagContent.replace(/^ADDON\s+/, '').trim();
    
    // Extract src if present
    const srcMatch = contentWithoutAddon.match(/src=["']([^"']+)["']/);
    const src = srcMatch ? srcMatch[1] : null;

    // The name is the first word of the content
    const name = contentWithoutAddon.split(/\s+/)[0];

    return { name, src, raw: match };
  });
}
