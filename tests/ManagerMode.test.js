import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildManager } from '../src/modes/ManagerMode.js';

// Mock JSZip
globalThis.JSZip = class {
  constructor() { this.files = {}; }
  file(path, content) { this.files[path] = content; }
  async generateAsync() { return { size: 1024, mockFiles: this.files }; }
};

// Mock fetch
globalThis.fetch = async (url) => {
  if (url.includes('renderit_editor.php')) {
    return { ok: true, text: async () => '<?php /* Editor */ ?>' };
  }
  return { ok: false };
};

test('ManagerMode: annotates simple variables', async () => {
  const config = {
    templates: {
      index: '<div><h1>%hero.title%</h1><p>%hero.desc%</p></div>'
    },
    data: {
      site: { name: 'Test', url: 'https://test.com' },
      hero: { title: 'Hello', desc: 'World' }
    }
  };

  const blob = await buildManager(config);
  const html = blob.mockFiles['index.html'];

  assert.ok(html.includes('<h1 renderit_manager_area="hero.title">'), 'h1 should have manager area');
  assert.ok(html.includes('<p renderit_manager_area="hero.desc">'), 'p should have manager area');
});

test('ManagerMode: handles multiple variables in the same element', async () => {
  const config = {
    templates: {
      index: '<img src="%hero.img%" alt="%hero.alt%">'
    },
    data: {
      site: { name: 'Test', url: 'https://test.com' },
      hero: { img: 'a.jpg', alt: 'A' }
    }
  };

  const blob = await buildManager(config);
  const html = blob.mockFiles['index.html'];

  assert.ok(html.includes('renderit_manager_area_src="hero.img"'), 'src area');
  assert.ok(html.includes('renderit_manager_area_alt="hero.alt"'), 'alt area');
});

test('ManagerMode: annotates loops with indexed paths', async () => {
  const config = {
    templates: {
      index: '%FOREACH items%<div>%name%</div>%ENDFOREACH%'
    },
    data: {
      site: { name: 'Test', url: 'https://test.com' },
      items: [{ name: 'Item 1' }, { name: 'Item 2' }]
    }
  };

  const blob = await buildManager(config);
  const html = blob.mockFiles['index.html'];

  // Check loop start markers
  assert.ok(html.includes('renderit_manager_collection="items"'), 'collection name');
  assert.ok(html.includes('renderit_manager_index="0"'), 'index 0');
  assert.ok(html.includes('renderit_manager_index="1"'), 'index 1');
  
  // Check indexed variables
  assert.ok(html.includes('renderit_manager_area="items[0].name"'), 'indexed area 0');
  assert.ok(html.includes('renderit_manager_area="items[1].name"'), 'indexed area 1');
});

test('ManagerMode: includes bridge files', async () => {
  const config = {
    templates: { index: '<h1>%site.name%</h1>' },
    data: { site: { name: 'Test', url: 'https://test.com' } }
  };

  const blob = await buildManager(config);
  const files = blob.mockFiles;

  assert.ok(files['bridge.php'], 'bridge.php');
  assert.ok(files['bridge.asp'], 'bridge.asp');
  assert.ok(files['.bridge.env'], '.bridge.env');
  assert.ok(files['renderit_editor.php'], 'renderit_editor.php');
});

test('ManagerMode: generates unique and secure secrets', async () => {
  const config = {
    templates: { index: '' },
    data: { site: { name: 'T', url: 'https://t.com' } }
  };

  const blob1 = await buildManager(config);
  const blob2 = await buildManager(config);

  const env1 = blob1.mockFiles['.bridge.env'];
  const env2 = blob2.mockFiles['.bridge.env'];

  const secret1 = env1.match(/BRIDGE_SECRET=(.+)/)[1].trim();
  const secret2 = env2.match(/BRIDGE_SECRET=(.+)/)[1].trim();

  assert.equal(secret1.length, 32, 'secret should be 32 chars');
  assert.notEqual(secret1, secret2, 'secrets should be unique across builds');
  assert.ok(/^[a-zA-Z0-9]+$/.test(secret1), 'secret should be alphanumeric');
});
