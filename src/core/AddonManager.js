import { AddonError } from './types.js';
import { tokenize } from './Lexer.js';
import { parse } from './Parser.js';
import { render } from './Renderer.js';
import { scanTemplate } from '../utils/AddonScanner.js';

/**
 * Gerencia a resolução, carregamento e injeção de Addons.
 */
export class AddonManager {
  constructor(config = {}) {
    this.addonsDir = config.addonsDir || './addons';
    this.themesRepoUrl = config.themesRepoUrl || 'https://raw.githubusercontent.com/zmdy/renderit.themes/refs/heads/main';
    this.resolvedAddons = new Map();
  }

  /**
   * Resolve e injeta todos os addons encontrados em um template.
   * @param {string} template 
   * @param {Object} [dataContext] - Objeto de dados para injeção de JSON externo
   * @returns {Promise<string>}
   */
  async resolveAndInject(template, dataContext = {}) {
    let result = template;
    const detectedAddons = scanTemplate(template);
    
    for (const { name, src } of detectedAddons) {
      const addonHtml = await this.resolveAddon(name);
      
      if (!this.resolvedAddons.has(name)) {
        this.resolvedAddons.set(name, {
          name,
          content: addonHtml,
          src,
          keys: this.extractAddonKeys(addonHtml)
        });
      }

      // Se houver um src definido, carrega o JSON e injeta no contexto sob o namespace do addon (nova estrutura)
      if (src && dataContext) {
        const externalData = await this._tryFetchJson(src);
        if (externalData) {
          if (!dataContext.addons) dataContext.addons = {};
          dataContext.addons[name] = Object.assign(dataContext.addons[name] || {}, externalData);
        }
      }

      // Pré-renderiza o addon com o dataContext (escopado) para resolver seus próprios %IF%/%FOREACH%
      // antes de injetar no template pai — evita conflitos de parse no template externo.
      const renderedAddon = this._renderAddon(addonHtml, dataContext, name);

      // Substituição exata da tag
      const tag = src ? `%ADDON ${name} src="${src}"%` : `%ADDON ${name}%`;
      result = result.split(tag).join(renderedAddon);
      
      // Fallback para variações de aspas se não deu match direto
      if (src) {
        const tagSingle = `%ADDON ${name} src='${src}'%`;
        result = result.split(tagSingle).join(renderedAddon);
      }
    }
    
    return result;
  }

  /**
   * Renderiza um addon com o contexto de dados, produzindo HTML puro sem tags de template.
   * @param {string} addonHtml 
   * @param {Object} dataContext 
   * @param {string} addonName
   * @returns {string}
   */
  _renderAddon(addonHtml, dataContext, addonName) {
    try {
      const tokens = tokenize(addonHtml);
      const ast = parse(tokens);
      
      const addonData = (dataContext.addons && dataContext.addons[addonName]) ? dataContext.addons[addonName] : (dataContext[addonName] || {});
      
      const addonId = `${addonName}-${Math.random().toString(36).substring(2, 7)}`;
      const scopedData = {
        ...dataContext,
        [addonName]: addonData, // Permite %addonName.var%
        ...addonData,            // Permite %var% (unqualified)
        id: addonId              // Injeta um ID único para o addon (ex: %id%)
      };

      return render(ast, { data: scopedData });
    } catch (e) {
      console.warn(`[AddonManager] Erro ao renderizar addon "${addonName}":`, e.message);
      // Se o addon falhar ao renderizar (ex: dados ausentes ou erro de sintaxe), 
      // retorna o HTML bruto sem as tags de controle para não travar o pipeline do template pai.
      return addonHtml
        .replace(/%FOREACH\s[^%]+%/g, '')
        .replace(/%ENDFOREACH%/g, '')
        .replace(/%IF\s[^%]+%/g, '')
        .replace(/%ENDIF%/g, '')
        .replace(/%ELSE%/g, '');
    }
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
    try {
      const tokens = tokenize(html);
      const keys = new Set();
      for (const token of tokens) {
        if (token.type === 'VAR' || token.type === 'FOREACH' || token.type === 'IF') {
          keys.add(token.value);
        }
      }
      return Array.from(keys);
    } catch (e) {
      // Addon com sintaxe interna complexa: retorna array vazio sem travar o build
      return [];
    }
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

  async _tryFetchJson(url) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      // Ignorar erro silenciosamente
    }
    return null;
  }

  getResolvedAddons() {
    return Array.from(this.resolvedAddons.values());
  }
}

