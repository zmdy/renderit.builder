import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSample } from '../src/utils/SampleGenerator.js';

test('SampleGenerator: extrai keys simples e ignora sistema', () => {
  const templates = [{
    name: 'index.html',
    content: '<title>%site.name%</title> <h1>%hero.title%</h1> <p>%YEAR%</p>'
  }];
  
  const sample = generateSample(templates);
  
  assert.equal(sample.pages.length, 1);
  assert.equal(sample.pages[0].slug, 'index');
  
  // hero.title foi extraído como objeto aninhado
  assert.equal(typeof sample.pages[0].content.hero, 'object');
  assert.equal(sample.pages[0].content.hero.title, '');
  
  // Magic keys do sistema devem ser ignoradas
  assert.equal(sample.pages[0].content.YEAR, undefined);
  
  // Chaves do root como 'site' também são ignoradas para não duplicar no 'content'
  assert.equal(sample.pages[0].content.site, undefined);
});

test('SampleGenerator: suporta arrays através do token FOREACH', () => {
  const templates = [{
    name: 'slider.html',
    content: '%FOREACH slider.items% <li>%slider.items.title%</li> %ENDFOREACH%'
  }];
  
  const sample = generateSample(templates);
  
  assert.ok(Array.isArray(sample.pages[0].content.slider.items), 'slider.items deve ser um array');
  assert.equal(sample.pages[0].content.slider.items.length, 1);
  assert.equal(sample.pages[0].content.slider.items[0].title, '');
});

test('SampleGenerator: resolve namespaces de Addons na raiz', () => {
  const templates = [{ name: 'index.html', content: '%ADDON whatsapp%' }];
  const addons = [{
    name: 'whatsapp',
    content: '<a href="wa.me/%whatsapp.number%">%whatsapp.text%</a>'
  }];
  
  const sample = generateSample(templates, addons);
  
  // As chaves do addon devem ir para o objeto root, não para as pages
  assert.equal(typeof sample.whatsapp, 'object');
  assert.equal(sample.whatsapp.number, '');
  assert.equal(sample.whatsapp.text, '');
});

test('SampleGenerator: produz output fragmentado (splitPages) corretamente', () => {
  const templates = [{ name: 'sobre.html', content: '%hero.title%' }];
  
  const result = generateSample(templates, [], { splitPages: true });
  
  assert.ok(result['site.json']);
  assert.ok(result['site.json'].site);
  assert.ok(result['site.json'].design);
  
  assert.ok(result['page-sobre.json']);
  assert.equal(result['page-sobre.json'].meta.slug, 'sobre');
  assert.equal(typeof result['page-sobre.json'].content.hero, 'object');
});
