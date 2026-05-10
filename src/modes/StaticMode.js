import { AddonManager } from '../core/AddonManager.js';
import { tokenize } from '../core/Lexer.js';
import { parse } from '../core/Parser.js';
import { render } from '../core/Renderer.js';
import { ZipBuilder } from '../utils/ZipBuilder.js';
import { scanAssets } from '../utils/AssetScanner.js';
import { generateRobotsTxt, generateSitemapXml, generateHtaccess, generateLlmsTxt } from '../utils/SeoGenerator.js';
import { optimizeHtml } from '../utils/HtmlOptimizer.js';

/**
 * Orquestra a construção do site estático (multi-page).
 * 
 * @param {Object} config 
 * @returns {Promise<Blob>}
 */
export async function buildStatic(config) {
  const emit = (event, payload) => config.onProgress && config.onProgress(event, payload);
  emit('start', { mode: 'static' });

  const zip = new ZipBuilder();
  const addonManager = new AddonManager(config);
  const pages = Object.keys(config.templates);

  for (const slug of pages) {
    await processPage(slug, config, addonManager, zip, emit, pages);
  }

  generateSeo(zip, config.data, pages, emit);
  packAssets(zip, config, emit);

  emit('zipping', {});
  const blob = await zip.build();
  emit('done', { size: blob.size });
  return blob;
}

async function processPage(slug, config, addonManager, zip, emit, pages) {
  emit('page_start', { slug });
  
  const pageData = config.data.pages?.find(p => p.slug === slug || p.template === `${slug}.html`) || {};
  const pageContext = { ...config.data, ...pageData, ...(pageData.content || {}) };

  emit('resolving_addons', { slug });
  let template = config.templates[slug];
  template = await addonManager.resolveAndInject(template, pageContext);
  
  emit('parsing', { slug });
  const tokens = tokenize(template);
  const ast = parse(tokens);
  const rawHtml = render(ast, { data: pageContext });
  const html = optimizeHtml(rawHtml);

  const filepath = (slug === 'index' || pages.length === 1) ? 'index.html' : `${slug}.html`;
  zip.addFile(filepath, html);
  
  emit('page_done', { slug, filepath });
}

function generateSeo(zip, data, pages, emit) {
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

function getPath(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
