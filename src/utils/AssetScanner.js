/**
 * Vasculha recursivamente um objeto de dados em busca de URLs 
 * que representem mídias ou arquivos estáticos locais (assets).
 * 
 * @param {Object} data 
 * @returns {string[]}
 */
export function scanAssets(data) {
  const assets = new Set();
  
  function recurse(obj) {
    if (!obj) return;
    if (typeof obj === 'string') {
      // Identifica paths relativos típicos de imagens e mídias
      if (obj.startsWith('assets/') || obj.match(/\.(png|jpg|jpeg|gif|svg|webp|mp4|webm)$/i)) {
        if (!obj.startsWith('http://') && !obj.startsWith('https://')) {
          assets.add(obj);
        }
      }
    } else if (typeof obj === 'object') {
      for (const key in obj) {
        recurse(obj[key]);
      }
    }
  }
  
  recurse(data);
  return Array.from(assets);
}
