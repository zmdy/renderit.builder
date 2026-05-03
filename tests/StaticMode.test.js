import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStatic } from '../src/modes/StaticMode.js';

// Setup Mocks de Ambiente Browser/CDN
globalThis.JSZip = class {
  constructor() {
    this.files = {};
  }
  file(path, content) {
    this.files[path] = content;
  }
  async generateAsync({ type }) {
    return { size: 1024, type: 'application/zip', mockFiles: this.files };
  }
};

test('StaticMode: E2E build gera estrutura multi-page, SEO e Zip corretamente', async () => {
  const events = [];
  const config = {
    templates: {
      index: '<h1>Home</h1><p>%site.name%</p>',
      sobre: '<h1>Sobre</h1><p>%site.name%</p>',
      contato: '<form>Contato</form>'
    },
    data: {
      site: {
        name: 'My Awesome Site',
        url: 'https://awesome.com',
        description: 'Um site incrível'
      },
      hero: {
        bg: 'assets/hero.jpg'
      }
    },
    assets: {
      'assets/hero.jpg': 'blob_mock_data'
    },
    onProgress: (event, payload) => {
      events.push(event);
    }
  };

  const blob = await buildStatic(config);

  // Validação do Zip Mocado
  assert.equal(blob.size, 1024);
  assert.ok(blob.mockFiles, 'Mock files deveriam estar presentes no blob simulado');

  const files = blob.mockFiles;

  // 1. Roteamento Multi-page (Pretty URLs)
  assert.ok(files['index.html']);
  assert.ok(files['sobre.html']);
  assert.ok(files['contato.html']);

  // 2. Renderização (Pipeline Core)
  assert.equal(files['index.html'], '<h1>Home</h1><p>My Awesome Site</p>');
  assert.equal(files['sobre.html'], '<h1>Sobre</h1><p>My Awesome Site</p>');

  // 3. SEO Files Gerados
  assert.ok(files['robots.txt']);
  assert.ok(files['sitemap.xml']);
  assert.ok(files['.htaccess']);
  assert.ok(files['llms.txt']);

  assert.ok(files['sitemap.xml'].includes('https://awesome.com/sobre/'));
  assert.ok(files['llms.txt'].includes('My Awesome Site'));
  assert.ok(files['llms.txt'].includes('Um site incrível'));
  assert.ok(files['llms.txt'].includes('## Pages'), 'llms.txt deve conter seção ## Pages');
  assert.ok(files['llms.txt'].includes('[index]'), 'llms.txt deve listar a página index');
  assert.ok(files['llms.txt'].includes('[sobre]'), 'llms.txt deve listar a página sobre');

  // 4. Scan e Injeção de Assets
  assert.equal(files['assets/hero.jpg'], 'blob_mock_data');

  // 5. Emissão de Lifecycle Events
  assert.ok(events.includes('start'));
  assert.ok(events.includes('page_start'));
  assert.ok(events.includes('resolving_addons'));
  assert.ok(events.includes('parsing'));
  assert.ok(events.includes('seo_generation'));
  assert.ok(events.includes('asset_scanning'));
  assert.ok(events.includes('zipping'));
  assert.ok(events.includes('done'));
});
