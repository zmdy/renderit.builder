import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLive, extractAndEncodeLiveZones } from '../src/modes/LiveMode.js';

// ─── Mock global JSZip ─────────────────────────────────────────────────────
globalThis.JSZip = class {
  constructor() { this.files = {}; }
  file(path, content) { this.files[path] = content; }
  async generateAsync() { return { size: 512, mockFiles: this.files }; }
};

// ─── Utilitário de decodificação para os testes ────────────────────────────
function decodeB64(str) {
  return Buffer.from(str, 'base64').toString('utf-8');
}

// ─── Testes de extractAndEncodeLiveZones (unitário puro) ──────────────────

test('extractAndEncodeLiveZones: encoda template em Base64 e injeta loading', () => {
  const html = `<div data-renderit-zone="menu" data-renderit-src="/data/menu.json">
    <ul><li>%item.name%</li></ul>
  </div>`;

  const result = extractAndEncodeLiveZones(html);

  assert.ok(result.includes('data-renderit-template='), 'deve adicionar data-renderit-template');
  assert.ok(result.includes('renderit-loading'), 'deve incluir o placeholder de loading');
  assert.ok(!result.includes('%item.name%'), 'template interno deve ter sido removido');

  // Extrai o valor do data-template e valida o decode
  const match = result.match(/data-renderit-template="([^"]+)"/);
  assert.ok(match, 'deve conter atributo data-renderit-template');
  const decoded = decodeB64(match[1]);
  assert.ok(decoded.includes('%item.name%'), 'conteúdo decodificado deve ter o template original');
});

test('extractAndEncodeLiveZones: ignora elementos sem template interno', () => {
  const html = `<div data-renderit-zone="vazio" data-renderit-src="/data.json"></div>`;
  const result = extractAndEncodeLiveZones(html);
  assert.ok(!result.includes('data-template='), 'não deve adicionar data-template em zonas vazias');
});

test('extractAndEncodeLiveZones: preserva HTML sem zonas intocado', () => {
  const html = '<h1>Título</h1><p>Sem zonas aqui</p>';
  const result = extractAndEncodeLiveZones(html);
  assert.equal(result, html);
});

// ─── Testes de buildLive (E2E com mocks) ─────────────────────────────────

test('buildLive: pipeline completo gera index.html com zonas e scripts', async () => {
  const events = [];
  let fetchCount = 0;

  globalThis.fetch = async (url) => {
    fetchCount++;
    if (url.includes('renderit-live.js')) return { ok: true, text: async () => '/* live script */' };
    if (url.includes('sw.js')) return { ok: true, text: async () => '/* sw script */' };
    return { ok: false };
  };

  const config = {
    templates: {
      index: `<main>
        <h1>%site.name%</h1>
        <div data-renderit-zone="menu" data-renderit-src="/data/menu.json">
          <ul>%menu.title%</ul>
        </div>
      </main>`
    },
    data: {
      site: { name: 'Live Site', url: 'https://live.com', description: 'Desc' }
    },
    onProgress: (e) => events.push(e)
  };

  const blob = await buildLive(config);
  const files = blob.mockFiles;

  // HTML com zona encodada
  assert.ok(files['index.html'], 'deve gerar index.html');
  assert.ok(files['index.html'].includes('data-renderit-template='), 'zona deve estar com data-renderit-template em Base64');
  assert.ok(files['index.html'].includes('renderit-loading'), 'deve ter placeholder de loading');
  assert.ok(files['index.html'].includes('Live Site'), 'variáveis fora de zona devem ser resolvidas');

  // Scripts live
  assert.equal(files['renderit-live.js'], '/* live script */', 'deve incluir renderit-live.js');
  assert.equal(files['sw.js'], '/* sw script */', 'deve incluir sw.js');

  // SEO
  assert.ok(files['robots.txt'], 'deve incluir robots.txt');
  assert.ok(files['sitemap.xml'], 'deve incluir sitemap.xml');
  assert.ok(files['llms.txt'].includes('## Pages'), 'llms.txt deve listar páginas');

  // Lifecycle events
  assert.ok(events.includes('start'));
  assert.ok(events.includes('zone_extraction'));
  assert.ok(events.includes('live_scripts'));
  assert.ok(events.includes('seo_generation'));
  assert.ok(events.includes('done'));
});

test('buildLive: fallback gracioso quando scripts live não estão disponíveis', async () => {
  globalThis.fetch = async () => ({ ok: false });

  const config = {
    templates: { index: '<h1>%site.name%</h1>' },
    data: { site: { name: 'Test', url: 'https://x.com', description: 'X' } },
    onProgress: () => {}
  };

  // Não deve lançar erro — scripts simplesmente não são incluídos
  const blob = await buildLive(config);
  const files = blob.mockFiles;

  assert.ok(files['index.html'], 'deve gerar index.html mesmo sem scripts live');
  assert.equal(files['renderit-live.js'], undefined, 'não deve incluir script que falhou');
});
