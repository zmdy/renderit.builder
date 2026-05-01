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
    const tagContent = match.slice(1, -1).trim();
    const parts = tagContent.split(' src=');
    const name = parts[0].replace(/^ADDON\s+/, '').trim();
    const src = parts[1] ? parts[1].replace(/["']/g, '').trim() : null;
    return { name, src };
  });
}
