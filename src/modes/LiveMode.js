import { AddonManager } from '../core/AddonManager.js';
import { tokenize } from '../core/Lexer.js';
import { parse } from '../core/Parser.js';
import { render } from '../core/Renderer.js';
import { ZipBuilder } from '../utils/ZipBuilder.js';
import { scanAssets } from '../utils/AssetScanner.js';
import { generateRobotsTxt, generateSitemapXml, generateHtaccess, generateLlmsTxt } from '../utils/SeoGenerator.js';

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
  emit('resolving_addons', { slug });

  let template = config.templates[slug];
  template = await addonManager.resolveAndInject(template);

  emit('parsing', { slug });
  const tokens = tokenize(template);
  const ast = parse(tokens);
  const html = render(ast, { data: config.data });

  emit('zone_extraction', { slug });
  const shellHtml = extractAndEncodeLiveZones(html);

  const filepath = slug === 'index' ? 'index.html' : `${slug}/index.html`;
  zip.addFile(filepath, shellHtml);
  emit('page_done', { slug, filepath });
}

/**
 * Localiza todos os data-renderit-zone, encoda o template interno em Base64
 * e substitui o conteúdo por um placeholder de loading.
 * @param {string} html
 * @returns {string}
 */
export function extractAndEncodeLiveZones(html) {
  const zonePattern = /(<[^>]+data-renderit-zone="[^"]*"[^>]*>)([\s\S]*?)(<\/[a-z][a-z0-9]*>)/gi;
  
  return html.replace(zonePattern, (match, openTag, innerContent, closeTag) => {
    const trimmed = innerContent.trim();
    if (!trimmed) return match;

    const encoded = encodeBase64(trimmed);
    const tagWithTemplate = openTag.replace('>', ` data-renderit-template="${encoded}">`);
    const loading = '<div class="renderit-loading"></div>';
    return `${tagWithTemplate}${loading}${closeTag}`;
  });
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
