import { tokenize } from '../core/Lexer.js';
import { buildDesignSample } from './DesignSystem.js';

const SYSTEM_KEYS = ['INDEX', 'TOTAL', 'FIRST', 'LAST', 'YEAR', 'CONTENT'];

/**
 * Gera o JSON de scaffold para os dados do projeto baseado nos templates e addons
 */
export function generateSample(templates, addons = [], options = { splitPages: false }) {
  const sample = {
    meta: { version: "1.0.0", language: "pt-BR", build_mode: "static" },
    site: buildSiteSample(),
    pages: [],
    design: buildDesignSample()
  };

  for (const tpl of templates) {
    const slug = tpl.name.replace(/\.html$/, '');
    const tokens = tokenize(tpl.content);
    sample.pages.push({
      slug, template: tpl.name, title: "", description: "",
      content: buildNestedObject(extractVarTypes(tokens))
    });
  }

  sample.addons = {};
  for (const addon of addons) {
    const tokens = tokenize(addon.content);
    const addonData = buildNestedObject(extractVarTypes(tokens));
    
    if (Object.keys(addonData).length > 0) {
      const normalizedName = addon.name.replace(/-/g, '_');
      if ((addonData[addon.name] || addonData[normalizedName]) && Object.keys(addonData).length === 1) {
        sample.addons[addon.name] = addonData[addon.name] || addonData[normalizedName];
      } else {
        sample.addons[addon.name] = addonData;
      }
    }
  }

  return options.splitPages ? buildSplitSample(sample) : sample;
}

function extractVarTypes(tokens) {
  const map = new Map();
  const scopeStack = [];

  for (const token of tokens) {
    if (token.type === 'FOREACH') {
      const currentScope = scopeStack.length > 0 ? scopeStack[scopeStack.length - 1] + '.' + token.value : token.value;
      scopeStack.push(currentScope);
      map.set(currentScope, 'array');
    } else if (token.type === 'ENDFOREACH') {
      scopeStack.pop();
    } else if (token.type === 'VAR' || token.type === 'IF') {
      let rawPath = token.value;
      
      // Se for um IF, extrai apenas a variável da condição (ex: 'highlighted == "true"' -> 'highlighted')
      if (token.type === 'IF') {
        rawPath = rawPath.split(/[=<>! ]/)[0].trim();
      }

      if (SYSTEM_KEYS.includes(rawPath) || rawPath.startsWith('design.') || rawPath.startsWith('site.')) continue;
      
      let fullPath = rawPath;
      // Se estamos dentro de um FOREACH, vincula a variável ao escopo do array atual
      if (scopeStack.length > 0) {
        const currentScope = scopeStack[scopeStack.length - 1];
        // Adiciona o prefixo do array se a variável já não o possuir
        if (!fullPath.startsWith(currentScope)) {
          fullPath = currentScope + '.' + fullPath;
        }
      }
      
      if (!map.has(fullPath)) {
        map.set(fullPath, 'string');
      }
    }
  }
  return map;
}

function buildNestedObject(pathTypeMap) {
  const result = {};
  for (const path of pathTypeMap.keys()) {
    const parts = path.split('.');
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) current[part] = current[part] || "";
      else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }
  
  for (const [path, type] of pathTypeMap.entries()) {
    if (type === 'array') {
      const parts = path.split('.');
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
      const last = parts[parts.length - 1];
      if (typeof current[last] === 'object' && !Array.isArray(current[last])) {
        current[last] = [current[last]];
      } else {
        current[last] = [];
      }
    }
  }
  return result;
}

function mergeDeep(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} });
      mergeDeep(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }
  return target;
}

function buildSplitSample(sample) {
  const result = {
    'site.json': { meta: sample.meta, site: sample.site, design: sample.design }
  };
  
  for (const key in sample) {
    if (!['meta', 'site', 'pages', 'design'].includes(key)) {
      result['site.json'][key] = sample[key];
    }
  }

  for (const page of sample.pages) {
    result[`page-${page.slug}.json`] = {
      meta: { slug: page.slug, template: page.template },
      title: page.title, description: page.description, content: page.content
    };
  }
  
  return result;
}

function buildSiteSample() {
  return {
    name: "", url: "", description: "", logo: "", favicon: "",
    contact: { email: "", phone: "", whatsapp: "", address: "" },
    social: { instagram: "", facebook: "", linkedin: "", youtube: "" },
    nav: [{ label: "", url: "", active: "" }]
  };
}


