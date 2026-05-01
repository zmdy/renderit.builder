import { AddonError } from './types.js';
import { tokenize } from './Lexer.js';

/**
 * Gerencia a resolução, carregamento e injeção de Addons.
 */
export class AddonManager {
  constructor(config = {}) {
    this.addonsDir = config.addonsDir || './addons';
    this.themesRepoUrl = config.themesRepoUrl || 'https://raw.githubusercontent.com/zmdy/renderit.themes/main';
    this.resolvedAddons = new Map();
  }

  /**
   * Resolve e injeta todos os addons encontrados em um template.
   * @param {string} template 
   * @returns {Promise<string>}
   */
  async resolveAndInject(template) {
    let result = template;
    const matches = result.match(/%ADDON\s+([^%]+)%/g) || [];
    
    for (const match of matches) {
      const tagContent = match.slice(1, -1).trim();
      const parts = tagContent.split(' src=');
      const name = parts[0].replace(/^ADDON\s+/, '').trim();
      const src = parts[1] ? parts[1].replace(/["']/g, '').trim() : null;

      const addonHtml = await this.resolveAddon(name);
      
      if (!this.resolvedAddons.has(name)) {
        this.resolvedAddons.set(name, {
          name,
          content: addonHtml,
          src,
          keys: this.extractAddonKeys(addonHtml)
        });
      }

      result = result.replace(match, addonHtml);
    }
    
    return result;
  }

  /**
   * Tenta carregar um addon localmente, depois via GitHub.
   * @param {string} name 
   * @returns {Promise<string>}
   */
  async resolveAddon(name) {
    if (this.resolvedAddons.has(name)) {
      return this.resolvedAddons.get(name).content;
    }

    const localHtml = await this._tryFetch(`${this.addonsDir}/${name}.html`);
    if (localHtml) return localHtml;

    const cacheKey = `addon_cache_${name}`;
    if (typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return cached;
    }

    const remoteHtml = await this._tryFetch(`${this.themesRepoUrl}/addons/${name}.html`);
    if (remoteHtml) {
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(cacheKey, remoteHtml);
      return remoteHtml;
    }

    throw new AddonError(`Addon "${name}" não encontrado localmente nem no repositório.`, { addonName: name });
  }

  /**
   * Extrai as variáveis mágicas usadas dentro do HTML do addon.
   * @param {string} html 
   * @returns {string[]}
   */
  extractAddonKeys(html) {
    const tokens = tokenize(html);
    const keys = new Set();
    for (const token of tokens) {
      if (token.type === 'VAR' || token.type === 'FOREACH' || token.type === 'IF') {
        keys.add(token.value);
      }
    }
    return Array.from(keys);
  }

  async _tryFetch(url) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
    } catch (e) {
      // Ignorar erro para fallback
    }
    return null;
  }

  getResolvedAddons() {
    return Array.from(this.resolvedAddons.values());
  }
}
