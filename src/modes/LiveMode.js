import { AddonManager } from '../core/AddonManager.js';
import { tokenize } from '../core/Lexer.js';
import { parse } from '../core/Parser.js';
import { render } from '../core/Renderer.js';
import { ZipBuilder } from '../utils/ZipBuilder.js';
import { scanAssets } from '../utils/AssetScanner.js';
import { generateRobotsTxt, generateSitemapXml, generateHtaccess, generateLlmsTxt } from '../utils/SeoGenerator.js';
import { optimizeHtml } from '../utils/HtmlOptimizer.js';

/**
 * Orquestra a construção do site no modo Live (zonas dinâmicas + SW).
 * @param {Object} config
 * @returns {Promise<Blob>}
 */
export async function buildLive(config) {
  const emit = (event, payload) => config.onProgress && config.onProgress(event, payload);
  emit('start', { mode: 'live' });

  const zip = new ZipBuilder();
  const addonManager = new AddonManager(config);
  const pages = Object.keys(config.templates);

  for (const slug of pages) {
    await processLivePage(slug, config, addonManager, zip, emit);
  }

  await packLiveScripts(zip, config, emit);
  generateLiveSeo(zip, config.data, pages, emit);
  packAssets(zip, config, emit);

  emit('zipping', {});
  const blob = await zip.build();
  emit('done', { size: blob.size });
  return blob;
}

async function processLivePage(slug, config, addonManager, zip, emit) {
  emit('page_start', { slug });
  
  let template = config.templates[slug];

  emit('zone_extraction', { slug });

  // Extrair zonas com tokens brutos ANTES do render e da injeção global.
  // Os addons DENTRO da zona serão expandidos em modo RAW (preservando %FOREACH%).
  const { templateWithPlaceholders, zoneMap } = await extractZonesBeforeRender(template, addonManager);

  emit('resolving_addons', { slug });
  // Injeta addons fora das zonas em modo pre-renderizado com scoping adequado.
  const staticShell = await addonManager.resolveAndInject(templateWithPlaceholders, config.data);

  emit('parsing', { slug });
  const tokens = tokenize(staticShell);
  const ast = parse(tokens);
  const rawHtml = render(ast, { data: config.data });

  // Restaurar as zonas encodadas no HTML já renderizado
  const htmlWithZones = restoreEncodedZones(rawHtml, zoneMap);
  const optimized = await optimizeHtml(htmlWithZones);

  // Gerar os arquivos JSON para cada zona (usa o template original para detectar src)
  extractAndGenerateSrcJsons(template, config.data, zip);

  // Injetar os scripts de runtime do Live Mode
  const shellHtml = injectLiveScriptTags(optimized);

  const totalPages = Object.keys(config.templates).length;
  const filepath = (slug === 'index' || totalPages === 1) ? 'index.html' : `${slug}/index.html`;
  zip.addFile(filepath, shellHtml);
  emit('page_done', { slug, filepath });
}


/**
 * Injeta no HTML as tags de script necessárias para o Live Mode.
 * Insere <script src="renderit-live.js" defer> antes do </body>.
 * (O registro do Service Worker é feito internamente pelo renderit-live.js)
 * @param {string} html
 * @returns {string}
 */
function injectLiveScriptTags(html) {
  const liveScript = `<script src="renderit-live.js" defer></script>`;
  const injection = `\n${liveScript}\n`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${injection}</body>`);
  }
  return html + injection;
}


/**
 * Extrai zonas do template ANTES da renderização, salvando os tokens brutos em Base64.
 * Substitui o conteúdo por um marcador temporário que não será processado pelo render().
 * @param {string} html 
 * @param {Object} addonManager
 * @returns {Promise<{templateWithPlaceholders: string, zoneMap: Object}>}
 */
export async function extractZonesBeforeRender(html, addonManager = null) {
  const openPattern = /<([a-z][a-z0-9]*)([^>]*?data-renderit-zone="[^"]*"[^>]*?)(?:\s*\/>|>)/gi;
  let result = '';
  let lastIndex = 0;
  let match;
  let zoneCounter = 0;
  const zoneMap = {};

  while ((match = openPattern.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    const fullOpenTag = match[0];
    const openTagStart = match.index;
    const contentStart = openTagStart + fullOpenTag.length;

    let depth = 1;
    let pos = contentStart;
    let innerEnd = -1;

    while (pos < html.length && depth > 0) {
      const nextOpen  = html.indexOf(`<${tagName}`, pos);
      const nextClose = html.indexOf(`</${tagName}>`, pos);

      if (nextClose === -1) break; // HTML malformado

      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Verifica que é um tag de abertura real
        const afterTagName = html[nextOpen + 1 + tagName.length];
        if (afterTagName === '>' || afterTagName === ' ' || afterTagName === '\n' || afterTagName === '\t' || afterTagName === '/') {
          depth++;
        }
        pos = nextOpen + 1;
      } else {
        depth--;
        if (depth === 0) innerEnd = nextClose;
        pos = nextClose + `</${tagName}>`.length;
      }
    }

    if (innerEnd === -1) continue; // zona malformada

    const innerContent = html.slice(contentStart, innerEnd).trim();
    const closeTagFull = `</${tagName}>`;
    const zoneEnd = innerEnd + closeTagFull.length;

    // Adiciona o HTML antes desta zona
    result += html.slice(lastIndex, openTagStart);

    if (!innerContent) {
      // Zona vazia
      result += html.slice(openTagStart, zoneEnd);
    } else {
      let zoneHtmlWithRawAddons = innerContent;
      if (addonManager) {
        zoneHtmlWithRawAddons = await addonManager.resolveAndInjectRaw(innerContent);
      }
      
      const encoded = encodeBase64(zoneHtmlWithRawAddons);
      const tagWithTemplate = fullOpenTag.replace('>', ` data-renderit-template="${encoded}">`);
      
      const zoneId = `__RENDERIT_ZONE_${zoneCounter++}__`;
      zoneMap[zoneId] = `${tagWithTemplate}<div class="renderit-loading"></div>${closeTagFull}`;
      
      result += zoneId; // Placeholder
    }

    lastIndex = zoneEnd;
    openPattern.lastIndex = lastIndex;
  }

  result += html.slice(lastIndex);
  return { templateWithPlaceholders: result, zoneMap };
}

/**
 * Restaura as zonas originais (agora encodadas) de volta no HTML após o render().
 * @param {string} html 
 * @param {Object} zoneMap 
 * @returns {string}
 */
export function restoreEncodedZones(html, zoneMap) {
  let result = html;
  for (const [zoneId, zoneHtml] of Object.entries(zoneMap)) {
    result = result.replace(zoneId, zoneHtml);
  }
  return result;
}

/**
 * Para compatibilidade com os testes unitários originais.
 * @param {string} html
 * @returns {Promise<string>}
 */
export async function extractAndEncodeLiveZones(html) {
  const { templateWithPlaceholders, zoneMap } = await extractZonesBeforeRender(html);
  return restoreEncodedZones(templateWithPlaceholders, zoneMap);
}

async function packLiveScripts(zip, config, emit) {
  emit('live_scripts', {});
  const baseUrl = config.liveScriptsBaseUrl || './src/live';

  const liveJs = await tryFetch(`${baseUrl}/renderit-live.js`);
  if (liveJs) zip.addFile('renderit-live.js', liveJs);

  const sw = await tryFetch(`${baseUrl}/sw.js`);
  if (sw) zip.addFile('sw.js', sw);
}

function generateLiveSeo(zip, data, pages, emit) {
  emit('seo_generation', {});
  const siteUrl = getPath(data, 'site.url');
  zip.addFile('robots.txt', generateRobotsTxt());
  zip.addFile('sitemap.xml', generateSitemapXml(siteUrl, pages));
  zip.addFile('.htaccess', generateHtaccess());
  zip.addFile('llms.txt', generateLlmsTxt(getPath(data, 'site.name'), getPath(data, 'site.description'), siteUrl, pages));
}

function packAssets(zip, config, emit) {
  emit('asset_scanning', {});
  const assetPaths = scanAssets(config.data);
  if (config.assets) {
    for (const path of assetPaths) {
      if (config.assets[path]) zip.addFile(path, config.assets[path]);
    }
  }
}

function encodeBase64(str) {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, 'utf-8').toString('base64');
}

async function tryFetch(url) {
  try {
    const res = await fetch(url);
    if (res.ok) return await res.text();
  } catch (_) { /* fallback silencioso */ }
  return null;
}

function getPath(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Detecta pares data-renderit-zone + data-renderit-src no mesmo elemento e
 * gera um arquivo JSON por zona contendo os dados relevantes.
 *
 * Estratégia de resolução do payload:
 *   1. data.addons[zoneName]  — namespace exato da zona
 *   2. data.addons            — todos os addons (a zona pode conter vários)
 *   3. {}                     — fallback vazio
 * @param {string} html
 * @param {Object} data
 * @param {ZipBuilder} zip
 */
function extractAndGenerateSrcJsons(html, data, zip) {
  const zonePattern = /data-renderit-zone="([^"]+)"[^>]*data-renderit-src="([^"]+)"|data-renderit-src="([^"]+)"[^>]*data-renderit-zone="([^"]+)"/gi;
  let match;
  while ((match = zonePattern.exec(html)) !== null) {
    const zoneName = match[1] || match[4];
    const srcPath  = match[2] || match[3];
    if (!zoneName || !srcPath) continue;

    const filename = srcPath.substring(srcPath.lastIndexOf('/') + 1);
    if (!filename || !filename.endsWith('.json')) continue;

    // Prioridade: namespace exato > todos os addons > vazio
    const exact   = getPath(data, `addons.${zoneName}`);
    const payload = exact ?? getPath(data, 'addons') ?? {};
    zip.addFile(filename, JSON.stringify(payload, null, 2));
  }
}


