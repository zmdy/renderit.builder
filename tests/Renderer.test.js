import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from '../src/core/Lexer.js';
import { parse } from '../src/core/Parser.js';
import { render } from '../src/core/Renderer.js';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

test('render: constrói HTML a partir de AST (pipeline completo)', () => {
  const ast = [
    { type: 'Text', value: 'Hello ' },
    { type: 'Var', path: 'name' }
  ];
  const html = render(ast, { data: { name: 'World' } });
  assert.equal(html, 'Hello World');
});

test('render: escape HTML em variáveis', () => {
  const ast = [{ type: 'Var', path: 'html' }];
  const html = render(ast, { data: { html: '<script>alert("xss")</script>' } });
  assert.equal(html, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
});

test('render: resolve variáveis profundas e de escopo local (FOREACH)', () => {
  const context = {
    data: { site: { name: 'Renderit' } },
    localData: { hero: { title: 'Local Title' } }
  };
  const ast = [
    { type: 'Var', path: 'hero.title' },
    { type: 'Text', value: ' - ' },
    { type: 'Var', path: 'site.name' }
  ];
  const html = render(ast, context);
  assert.equal(html, 'Local Title - Renderit');
});

test('render: lida com IF evaluateCondition e alternate (ELSE)', () => {
  const context = { data: { show: false } };
  const ast = [
    {
      type: 'If',
      condition: 'show',
      children: [{ type: 'Text', value: 'A' }],
      alternate: [{ type: 'Text', value: 'B' }]
    }
  ];
  const html = render(ast, context);
  assert.equal(html, 'B');
});

test('render: processa as 16 fixtures felizes batendo output (E2E)', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const files = fs.readdirSync(fixturesDir)
    .filter(f => f.endsWith('.html') && !f.endsWith('.expected.html'))
    .filter(f => {
      const num = parseInt(f.split('-')[0], 10);
      return num >= 1 && num <= 16;
    });

  for (const file of files) {
    const name = file.replace('.html', '');
    const template = fs.readFileSync(path.join(fixturesDir, file), 'utf8');
    const jsonStr = fs.readFileSync(path.join(fixturesDir, `${name}.json`), 'utf8');
    const data = JSON.parse(jsonStr);
    
    const expectedPath = path.join(fixturesDir, `${name}.expected.html`);
    if (fs.existsSync(expectedPath)) {
      const expected = fs.readFileSync(expectedPath, 'utf8');
      
      const tokens = tokenize(template);
      const ast = parse(tokens);
      let output = render(ast, { data });
      
      if (name === '05-global-vars') {
        const year = new Date().getFullYear().toString();
        output = output.replace(year, '2026');
      }

      assert.equal(output.trim(), expected.trim(), `Falha no render da fixture: ${name}`);
    }
  }
});
