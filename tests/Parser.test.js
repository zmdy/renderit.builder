import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/core/Parser.js';
import { tokenize } from '../src/core/Lexer.js';
import { ParseError } from '../src/core/types.js';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

test('parse: converte blocos básicos em árvores de pais/filhos', () => {
  const tokens = tokenize('<h1>%title%</h1>');
  const ast = parse(tokens);
  assert.equal(ast.length, 3);
  assert.equal(ast[0].type, 'Text');
  assert.equal(ast[1].type, 'Var');
  assert.equal(ast[1].path, 'title');
  assert.equal(ast[2].type, 'Text');
});

test('parse: FOREACH gera children', () => {
  const tokens = tokenize('%FOREACH items% %name% %ENDFOREACH%');
  const ast = parse(tokens);
  assert.equal(ast.length, 1);
  assert.equal(ast[0].type, 'ForEach');
  assert.equal(ast[0].children.length, 3);
  assert.equal(ast[0].children[1].type, 'Var');
  assert.equal(ast[0].children[1].path, 'name');
});

test('parse: IF gera alternate com ELSE', () => {
  const tokens = tokenize('%IF cond% A %ELSE% B %ENDIF%');
  const ast = parse(tokens);
  assert.equal(ast.length, 1);
  assert.equal(ast[0].type, 'If');
  assert.equal(ast[0].children.length, 1);
  assert.equal(ast[0].children[0].value.trim(), 'A');
  assert.equal(ast[0].alternate.length, 1);
  assert.equal(ast[0].alternate[0].value.trim(), 'B');
});

test('parse: lanca ParseError em tag isolada/desemparelhada', () => {
  assert.throws(() => parse(tokenize('%ELSE%')), ParseError);
  assert.throws(() => parse(tokenize('%ENDIF%')), ParseError);
  assert.throws(() => parse(tokenize('%ENDFOREACH%')), ParseError);
  assert.throws(() => parse(tokenize('%IF x% %ENDFOREACH%')), ParseError);
});

test('parse: lanca ParseError em final de documento com bloco aberto', () => {
  assert.throws(() => parse(tokenize('%FOREACH items%')), ParseError);
  assert.throws(() => parse(tokenize('%IF cond%')), ParseError);
});

test('parse: processa as 16 fixtures de sucesso sem erros', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  // Process files 01 to 16
  const files = fs.readdirSync(fixturesDir)
    .filter(f => f.endsWith('.html') && !f.endsWith('.expected.html'))
    .filter(f => {
      const num = parseInt(f.split('-')[0], 10);
      return num >= 1 && num <= 16;
    });

  for (const file of files) {
    const content = fs.readFileSync(path.join(fixturesDir, file), 'utf8');
    const tokens = tokenize(content);
    const ast = parse(tokens);
    assert.ok(Array.isArray(ast), `Falha ao fazer parse do fixture: ${file}`);
  }
});

test('parse: processa as fixtures de erro (17 e 18) lançando ParseError', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const errFiles = ['17-error-unclosed-loop.html', '18-error-unclosed-if.html'];
  
  for (const file of errFiles) {
    const content = fs.readFileSync(path.join(fixturesDir, file), 'utf8');
    const tokens = tokenize(content);
    assert.throws(() => parse(tokens), ParseError, `Falha em disparar ParseError no fixture: ${file}`);
  }
});
