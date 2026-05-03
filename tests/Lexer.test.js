import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from '../src/core/Lexer.js';
import { ParseError } from '../src/core/types.js';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

test('tokenize: string vazia retorna array vazio', () => {
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize(null), []);
});

test('tokenize: texto sem chaves', () => {
  assert.deepEqual(tokenize('Hello World'), [{ type: 'TEXT', value: 'Hello World', line: 1 }]);
});

test('tokenize: identifica chaves corretamente', () => {
  const result = tokenize('%VAR% %FOREACH x% %ENDFOREACH% %IF y% %ELSE% %ENDIF% %PARTIAL z% %ADDON w%');
  const types = result.filter(t => t.type !== 'TEXT').map(t => t.type);
  assert.deepEqual(types, ['VAR', 'FOREACH', 'ENDFOREACH', 'IF', 'ELSE', 'ENDIF', 'PARTIAL', 'ADDON']);
});

test('tokenize: tolera % não fechado como texto literal', () => {
  const result = tokenize('Texto %aberto e sem fechar');
  assert.deepEqual(result, [
    { type: 'TEXT', value: 'Texto %aberto e sem fechar', line: 1 }
  ]);
});

test('tokenize: ignora % em contextos de CSS ou JS (com ;, {, }, ,, (, ) ou quebra de linha)', () => {
  const result = tokenize('width: 100%; height: %var%; transform: translate(-50%, -50%);');
  assert.equal(result.filter(t => t.type === 'VAR').length, 1);
  assert.equal(result.find(t => t.type === 'VAR').value, 'var');
});

test('tokenize: escape %% gera texto %', () => {
  const result = tokenize('50%% off');
  assert.deepEqual(result, [
    { type: 'TEXT', value: '50% off', line: 1 }
  ]);
});

test('tokenize: contar linhas corretamente', () => {
  const result = tokenize('Linha 1\nLinha 2\n%VAR%');
  assert.equal(result[1].type, 'VAR');
  assert.equal(result[1].line, 3);
});

test('tokenize: processa todos os fixtures sem erros léxicos', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.html') && !f.endsWith('.expected.html'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(fixturesDir, file), 'utf8');
    const tokens = tokenize(content);
    assert.ok(Array.isArray(tokens), `Falha ao tokenizar fixture: ${file}`);
  }
});
