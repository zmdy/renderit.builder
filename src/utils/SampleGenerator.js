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

  // Collect all array paths sorted by depth (shallowest first)
  const arrayPaths = [...pathTypeMap.entries()]
    .filter(([, type]) => type === 'array')
    .map(([path]) => path)
    .sort((a, b) => a.split('.').length - b.split('.').length);

  // Build a prototype item for every array, containing all its child vars/arrays
  // Returns { protoItem, childArrays } for a given array path prefix
  function buildProtoItem(arrayPath) {
    const prefix = arrayPath + '.';
    const protoItem = {};

    for (const [childPath, childType] of pathTypeMap.entries()) {
      if (!childPath.startsWith(prefix)) continue;

      // Only direct children (no deeper array intermediaries between us and the child)
      const relative = childPath.slice(prefix.length);
      const relativeParts = relative.split('.');

      // Detect if this child is nested inside another array that's inside our array
      let isDirectChild = true;
      let checkPath = arrayPath;
      for (let i = 0; i < relativeParts.length - 1; i++) {
        checkPath += '.' + relativeParts[i];
        if (pathTypeMap.get(checkPath) === 'array') {
          isDirectChild = false;
          break;
        }
      }
      if (!isDirectChild) continue;

      // Set the value in protoItem
      const parts = relativeParts;
      let cur = protoItem;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      const leaf = parts[parts.length - 1];
      if (childType === 'array') {
        // Nested array inside this array's proto item
        const nestedProto = buildProtoItem(arrayPath + '.' + relative);
        cur[leaf] = [nestedProto];
      } else {
        cur[leaf] = cur[leaf] !== undefined ? cur[leaf] : '';
      }
    }
    return protoItem;
  }

  // Place top-level vars (not inside any array)
  for (const [path, type] of pathTypeMap.entries()) {
    if (type === 'array') continue;
    // Check if this var is inside any array
    const insideArray = arrayPaths.some(ap => path.startsWith(ap + '.'));
    if (insideArray) continue;

    const parts = path.split('.');
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    const leaf = parts[parts.length - 1];
    if (cur[leaf] === undefined) cur[leaf] = '';
  }

  // Place top-level arrays (not inside any other array)
  for (const ap of arrayPaths) {
    const insideArray = arrayPaths.some(other => other !== ap && ap.startsWith(other + '.'));
    if (insideArray) continue;

    const parts = ap.split('.');
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    const leaf = parts[parts.length - 1];
    cur[leaf] = [buildProtoItem(ap)];
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


