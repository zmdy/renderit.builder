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
  const tagAnnotations = new Map(); // Pos -> Array of paths
  const markerRegex = /\[\[rma-start:([\s\S]+?)\]\]/g;
  let match;

  while ((match = markerRegex.exec(result)) !== null) {
    const path = match[1];
    const pos = findParentTagPos(result, match.index);
    if (pos !== -1) {
      if (!tagAnnotations.has(pos)) tagAnnotations.set(pos, []);
      tagAnnotations.get(pos).push(path);
    }
  }

  // 3. Inject attributes into tags
  const sortedPositions = Array.from(tagAnnotations.keys()).sort((a, b) => b - a);
  for (const pos of sortedPositions) {
    const paths = tagAnnotations.get(pos);
    let attrs = '';
    paths.forEach((p, i) => {
      const suffix = i === 0 ? '' : `_${i + 1}`;
      attrs += ` renderit_manager_area${suffix}="${p}"`;
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
    // If we find an opening tag start without having seen a closing tag start
    if (html[i] === '<') {
      if (html[i + 1] === '/') {
        depth++; // Closing tag (backwards)
      } else {
        if (depth === 0) return i; // This is the opening tag we are in
        depth--;
      }
    } else if (html[i] === '>') {
      // If we see a tag end (backwards), we might be skiping a whole element
      // or we just found the end of the opening tag we are in.
      // But we can't be sure without looking at the next char.
      // However, if we skip closing tags via the depth counter, 
      // the first < we hit at depth 0 MUST be our parent.
      
      // Wait, if we are at <img src="[marker]">, there is no > before us in THIS tag.
      // If we are at <div>[marker]</div>, there IS a > before us (the one from <div>).
      
      // The logic: depth tracks how many elements we are "inside" as we go backwards.
      // <p> <a> [marker] </a> </p>
      // 1. see </a> -> depth becomes 1
      // 2. see <a> -> depth becomes 0
      // 3. see <p> -> depth is 0, return its pos.
    }
  }
  return -1;
}

// For compatibility with ManagerMode.js
export function finalizeAttributes(html) { return html; }
