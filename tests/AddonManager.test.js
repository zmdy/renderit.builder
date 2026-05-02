import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AddonManager } from '../src/core/AddonManager.js';
import { AddonError } from '../src/core/types.js';

let originalFetch;

function setupMocks() {
  originalFetch = globalThis.fetch;
  
  const store = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

function restoreMocks() {
  globalThis.fetch = originalFetch;
  delete globalThis.sessionStorage;
}

test('AddonManager: carrega localmente e injeta', async () => {
  setupMocks();
  globalThis.fetch = async (url) => {
    if (url.includes('./addons/slider.html')) {
      return { ok: true, text: async () => '<div>Slider Local</div>' };
    }
    return { ok: false };
  };

  const manager = new AddonManager();
  const template = '<main>%ADDON slider%</main>';
  const result = await manager.resolveAndInject(template);

  assert.equal(result, '<main><div>Slider Local</div></main>');
  restoreMocks();
});

test('AddonManager: fallback pro github e cache sessionStorage', async () => {
  setupMocks();
  let fetchCount = 0;
  globalThis.fetch = async (url) => {
    fetchCount++;
    if (url.includes('/addons/slider.html')) {
      if (url.startsWith('https://')) { // github fallback
        return { ok: true, text: async () => '<div>Slider Remote</div>' };
      }
    }
    return { ok: false };
  };

  const manager = new AddonManager();
  const template = '%ADDON slider%';
  const result = await manager.resolveAndInject(template);

  assert.equal(result, '<div>Slider Remote</div>');
  assert.equal(fetchCount, 2); 
  assert.equal(globalThis.sessionStorage.getItem('addon_cache_slider'), '<div>Slider Remote</div>');

  // Testando resolvedAddons in-memory (zero fetches na 2a vez)
  const result2 = await manager.resolveAndInject(template);
  assert.equal(result2, '<div>Slider Remote</div>');
  assert.equal(fetchCount, 2);
  
  restoreMocks();
});

test('AddonManager: cache sessionStorage funciona entre instâncias', async () => {
  setupMocks();
  globalThis.sessionStorage.setItem('addon_cache_slider', '<div>Cached</div>');
  
  let fetchCount = 0;
  globalThis.fetch = async () => { fetchCount++; return { ok: false }; };

  const manager = new AddonManager();
  const result = await manager.resolveAndInject('%ADDON slider%');

  assert.equal(result, '<div>Cached</div>');
  assert.equal(fetchCount, 1); // Tentou local, falhou, achou no sessionStorage
  
  restoreMocks();
});

test('AddonManager: dispara AddonError quando falha total', async () => {
  setupMocks();
  globalThis.fetch = async () => ({ ok: false }); // Tudo falha

  const manager = new AddonManager();
  await assert.rejects(
    async () => manager.resolveAndInject('%ADDON missing%'),
    AddonError
  );

  restoreMocks();
});

test('AddonManager: extrai magic keys de um addon', () => {
  const manager = new AddonManager();
  const html = `
    <div>%title%</div>
    %FOREACH items% <li>%items.name%</li> %ENDFOREACH%
    %IF show% <p>Show</p> %ENDIF%
  `;
  const keys = manager.extractAddonKeys(html);
  
  assert.ok(keys.includes('title'));
  assert.ok(keys.includes('items'));
  assert.ok(keys.includes('items.name'));
  assert.ok(keys.includes('show'));
  assert.equal(keys.length, 4);
});
test('AddonManager: carrega JSON externo e injeta no contexto', async () => {
  setupMocks();
  globalThis.fetch = async (url) => {
    if (url.includes('slider.html')) return { ok: true, text: async () => '<div>%slider.title%</div>' };
    if (url.includes('data.json')) return { ok: true, json: async () => ({ title: 'External Title' }) };
    return { ok: false };
  };

  const manager = new AddonManager();
  const context = {};
  const result = await manager.resolveAndInject('%ADDON slider src="data.json"%', context);

  assert.equal(context.slider.title, 'External Title');
  assert.ok(result.includes('<div>External Title</div>'));
  
  restoreMocks();
});
