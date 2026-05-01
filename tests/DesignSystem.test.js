import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDesignSample, validateDesign } from '../src/utils/DesignSystem.js';

test('DesignSystem: constrói a fundação do design corretamente', () => {
  const design = buildDesignSample();
  assert.ok(design.colors.primary, 'Deve prever a cor primária');
  assert.ok(design.typography['body-md'], 'Deve possuir a tipografia base');
  assert.ok(design.spacing.md, 'Deve possuir escala de espaçamento md');
  assert.equal(design.meta.version, '1.0.0');
});

test('DesignSystem: a validação deve aprovar um design impecável', () => {
  const design = buildDesignSample();
  const validation = validateDesign(design);
  assert.equal(validation.valid, true);
  assert.equal(validation.errors.length, 0);
});

test('DesignSystem: a validação deve capturar falhas em grupos principais', () => {
  const faultyDesign = {
    meta: { version: '1' },
    colors: { primary: '#fff' }
  };
  
  const validation = validateDesign(faultyDesign);
  assert.equal(validation.valid, false);
  
  // Confirma se o grupo typography, que foi omitido, foi citado no erro
  assert.ok(validation.errors.some(e => e.includes('typography')));
});

test('DesignSystem: a validação deve exigir regras sensíveis (ex: colors.primary)', () => {
  const design = buildDesignSample();
  delete design.colors.primary;
  
  const validation = validateDesign(design);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(e => e.includes('primary')));
});
