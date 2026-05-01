import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateRobotsTxt, generateSitemapXml, generateLlmsTxt, generateHtaccess } from '../src/utils/SeoGenerator.js';

test('SeoGenerator: gera robots.txt padrão', () => {
  const robots = generateRobotsTxt();
  assert.ok(robots.includes('User-agent: *'));
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Sitemap: /sitemap.xml'));
});

test('SeoGenerator: gera sitemap.xml corretamente', () => {
  const sitemap = generateSitemapXml('https://meusite.com', ['index', 'sobre', 'contato']);
  assert.ok(sitemap.includes('<loc>https://meusite.com</loc>'));
  assert.ok(sitemap.includes('<loc>https://meusite.com/sobre/</loc>'));
  assert.ok(sitemap.includes('<loc>https://meusite.com/contato/</loc>'));
});

test('SeoGenerator: gera llms.txt formatado com URL e lista de páginas', () => {
  const llms = generateLlmsTxt('Meu Site Top', 'Apenas um teste de SEO', 'https://meusite.com', ['index', 'sobre']);
  assert.ok(llms.includes('# Meu Site Top'));
  assert.ok(llms.includes('Apenas um teste de SEO'));
  assert.ok(llms.includes('## Pages'));
  assert.ok(llms.includes('[index](https://meusite.com)'));
  assert.ok(llms.includes('[sobre](https://meusite.com/sobre/)'));
});

test('SeoGenerator: gera .htaccess com as configurações de cache', () => {
  const htaccess = generateHtaccess();
  assert.ok(htaccess.includes('mod_expires.c'));
  assert.ok(htaccess.includes('ExpiresActive On'));
  assert.ok(htaccess.includes('mod_deflate.c'));
});
