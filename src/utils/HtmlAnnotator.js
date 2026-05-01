const SYSTEM_KEYS = new Set([
  'INDEX', 'INDEX_1', 'TOTAL', 'FIRST', 'LAST',
  'YEAR', 'BUILD_DATE', 'VERSION', 'SITE_NAME', 'SITE_URL', 'RENDERIT_VERSION'
]);

/**
 * Injects markers into the template.
 */
export function injectMarkers(template) {
  let result = template;

  // 1. Process FOREACH
  result = result.replace(/%FOREACH\s+([^%]+)%/g, (match, col) => {
    return `%FOREACH ${col}%[[rma-loop:${col}:%INDEX%]]`;
  });

  // 2. Process Variables (including loop context)
  const tokens = result.split(/(%FOREACH\s+[^%]+%|%ENDFOREACH%|%[a-zA-Z0-9_.]+%)/g);
  let loopStack = [];
  
  return tokens.map(token => {
    if (token.startsWith('%FOREACH')) {
      loopStack.push(token.match(/%FOREACH\s+([^%]+)%/)[1]);
      return token;
    }
    if (token === '%ENDFOREACH%') {
      loopStack.pop();
      return token;
    }
    if (token.startsWith('%') && token.endsWith('%')) {
      const path = token.slice(1, -1);
      const root = path.split('.')[0].toUpperCase();
      if (SYSTEM_KEYS.has(root) || SYSTEM_KEYS.has(path)) return token;
      
      let fullPath = path;
      if (loopStack.length > 0) {
        fullPath = `${loopStack[loopStack.length - 1]}[%INDEX%].${path}`;
      }
      return `[[rma-start:${fullPath}]]${token}[[rma-end]]`;
    }
    return token;
  }).join('');
}

/**
 * Main entry point for annotation.
 */
export function processAnnotations(html) {
  let result = html;
  
  // 1. Loop annotations
  result = result.replace(/\[\[rma-loop:([^:]+):(\d+)\]\]\s*(<[a-zA-Z][a-zA-Z0-9]*)/g, 
    (m, col, idx, tag) => `${tag} renderit_manager_collection="${col}" renderit_manager_index="${idx}"`
  );

  // 2. Variable annotations
  const tagAnnotations = new Map(); // Pos -> Array of {path, attrName}
  const markerRegex = /\[\[rma-start:([\s\S]+?)\]\]/g;
  let match;

  while ((match = markerRegex.exec(result)) !== null) {
    const path = match[1];
    const pos = findParentTagPos(result, match.index);
    if (pos !== -1) {
      const attrName = findEnclosingAttribute(result, pos, match.index);
      if (!tagAnnotations.has(pos)) tagAnnotations.set(pos, []);
      tagAnnotations.get(pos).push({ path, attrName });
    }
  }

  // 3. Inject attributes into tags
  const sortedPositions = Array.from(tagAnnotations.keys()).sort((a, b) => b - a);
  for (const pos of sortedPositions) {
    const annotations = tagAnnotations.get(pos);
    let attrs = '';
    const usedSuffixes = new Set();
    
    annotations.forEach((ann, i) => {
      let suffix = '';
      if (ann.attrName) {
        suffix = `_${ann.attrName}`;
      } else {
        // Find next available numerical suffix
        let n = i === 0 ? 0 : i + 1;
        while (n > 0 && usedSuffixes.has(`_${n}`)) n++;
        suffix = n === 0 ? '' : `_${n}`;
      }
      
      usedSuffixes.add(suffix);
      attrs += ` renderit_manager_area${suffix}="${ann.path}"`;
    });

    const tagEnd = result.indexOf('>', pos);
    if (tagEnd !== -1) {
      const isSelfClosing = result[tagEnd - 1] === '/';
      const insertPos = isSelfClosing ? tagEnd - 1 : tagEnd;
      result = result.slice(0, insertPos) + attrs + result.slice(insertPos);
    }
  }

  // 4. Cleanup
  return result.replace(/\[\[rma-(start|loop):[\s\S]+?\]\]|\[\[rma-end\]\]/g, '');
}

/**
 * Finds the position of the opening tag that encloses the given position.
 */
function findParentTagPos(html, startPos) {
  let depth = 0;
  for (let i = startPos - 1; i >= 0; i--) {
    if (html[i] === '<') {
      if (html[i + 1] === '/') {
        depth++;
      } else {
        if (depth === 0) return i;
        depth--;
      }
    }
  }
  return -1;
}

/**
 * Checks if the marker is inside an attribute and returns the attribute name.
 */
function findEnclosingAttribute(html, tagPos, markerPos) {
  const fragment = html.slice(tagPos, markerPos);
  // Look for attribute pattern before the marker: name=" or name='
  const match = fragment.match(/([a-zA-Z0-9_-]+)\s*=\s*["'][^"']*$/);
  return match ? match[1] : null;
}

export function finalizeAttributes(html) { return html; }
