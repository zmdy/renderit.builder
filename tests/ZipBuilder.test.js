import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ZipBuilder } from '../src/utils/ZipBuilder.js';

// Setup Mock de JSZip para rodar no ambiente Node
globalThis.JSZip = class {
  constructor() {
    this.files = {};
  }
  file(path, content, opts = {}) {
    this.files[path] = { content, opts };
  }
  async generateAsync(opts) {
    return { blob: true, type: opts.type, files: this.files };
  }
};

test('ZipBuilder: implementa addFile, addBinaryFile e build conforme a spec', async () => {
  const builder = new ZipBuilder();
  
  builder.addFile('index.html', '<h1>Hello World</h1>');
  
  const buffer = new Uint8Array([10, 20, 30]);
  builder.addBinaryFile('assets/image.png', buffer);

  const result = await builder.build();
  
  assert.ok(result.blob);
  assert.equal(result.type, 'blob');
  
  assert.equal(result.files['index.html'].content, '<h1>Hello World</h1>');
  
  // Confirma se a flag binary foi repassada para o objeto interno do JSZip
  assert.equal(result.files['assets/image.png'].opts.binary, true);
  assert.deepEqual(result.files['assets/image.png'].content, buffer);
});
