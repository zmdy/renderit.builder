import { AddonManager } from '../core/AddonManager.js';
import { tokenize } from '../core/Lexer.js';
import { parse } from '../core/Parser.js';
import { render } from '../core/Renderer.js';
import { ZipBuilder } from '../utils/ZipBuilder.js';
import { scanAssets } from '../utils/AssetScanner.js';
import { generateRobotsTxt, generateSitemapXml, generateHtaccess, generateLlmsTxt } from '../utils/SeoGenerator.js';
import { injectMarkers, processAnnotations, finalizeAttributes } from '../utils/HtmlAnnotator.js';
import { generateBridgeFiles } from '../utils/BridgeGenerator.js';

/**
 * Orquestra a construção do site no modo Manager.
 * 
 * @param {Object} config 
 * @returns {Promise<Blob>}
 */
export async function buildManager(config) {
  const emit = (event, payload) => config.onProgress && config.onProgress(event, payload);
  emit('start', { mode: 'manager' });

  const zip = new ZipBuilder();
  const addonManager = new AddonManager(config);
  const pages = Object.keys(config.templates);

  for (const slug of pages) {
    await processManagerPage(slug, config, addonManager, zip, emit, pages);
  }

  generateManagerSeo(zip, config.data, pages, emit);
  packAssets(zip, config, emit);
  await addBridgeFiles(zip, config, emit);

  emit('zipping', {});
  const blob = await zip.build();
  emit('done', { size: blob.size });
  return blob;
}

async function processManagerPage(slug, config, addonManager, zip, emit, pages) {
  emit('page_start', { slug });
  
  const pageData = config.data.pages?.find(p => p.slug === slug || p.template === `${slug}.html`) || {};
  const pageContext = { ...config.data, ...pageData, ...(pageData.content || {}) };

  emit('resolving_addons', { slug });
  let template = config.templates[slug];
  template = await addonManager.resolveAndInject(template, pageContext);
  
  // Inject markers for annotation
  const markedTemplate = injectMarkers(template);
  
  emit('parsing', { slug });
  const tokens = tokenize(markedTemplate);
  const ast = parse(tokens);
  const html = render(ast, { data: pageContext });

  emit('annotating', { slug });
  let annotatedHtml = processAnnotations(html);
  annotatedHtml = finalizeAttributes(annotatedHtml);

  const filepath = (slug === 'index' || pages.length === 1) ? 'index.html' : `${slug}.html`;
  zip.addFile(filepath, annotatedHtml);
  
  emit('page_done', { slug, filepath });
}

function generateManagerSeo(zip, data, pages, emit) {
  emit('seo_generation', {});
  const siteUrl = getPath(data, 'site.url');
  
  zip.addFile('robots.txt', generateRobotsTxt());
  zip.addFile('sitemap.xml', generateSitemapXml(siteUrl, pages));
  zip.addFile('.htaccess', generateHtaccess());
  zip.addFile('llms.txt', generateLlmsTxt(getPath(data, 'site.name'), getPath(data, 'site.description'), siteUrl, pages));
}

async function addBridgeFiles(zip, config, emit) {
  emit('bridge_generation', {});
  const siteUrl = getPath(config.data, 'site.url') || 'http://localhost';
  const bridgeFiles = generateBridgeFiles(siteUrl, config.version || '1.0.0');
  
  for (const [name, content] of Object.entries(bridgeFiles)) {
    zip.addFile(name, content);
  }

  // Fetch remote editor files from GitHub
  const BASE_URL = 'https://raw.githubusercontent.com/zmdy/renderit.editor/main';
  const remoteFiles = ['renderit_editor.php', 'bridge-core.php'];

  for (const filename of remoteFiles) {
    const content = await fetchRemoteFile(`${BASE_URL}/${filename}`);
    if (content) {
      zip.addFile(filename, content);
    } else {
      emit('warning', { message: `Could not fetch ${filename}. Please add it manually to the server.` });
    }
  }
}

async function fetchRemoteFile(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
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

function getPath(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
