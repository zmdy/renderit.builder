function resolveVar(path, data) {
  if (!path || !data) return '';
  let val = path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), data);
  if (val === undefined) {
    for (const key in data) {
      if (data[key] && typeof data[key] === 'object') {
        let deepVal = path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), data[key]);
        if (deepVal !== undefined) return deepVal;
      }
    }
  }
  return val ?? '';
}
function escapeHtml(str) { return str; }

function renderForeach(tpl, data) {
  let result = '';
  let pos = 0;
  while (true) {
    let startIdx = tpl.indexOf('%FOREACH ', pos);
    if (startIdx === -1) {
      result += tpl.slice(pos);
      break;
    }
    let tagEnd = tpl.indexOf('%', startIdx + 9);
    if (tagEnd === -1) break;
    let key = tpl.slice(startIdx + 9, tagEnd).trim();
    let contentStart = tagEnd + 1;
    let depth = 1;
    let innerEnd = -1;
    let searchPos = contentStart;
    
    while (searchPos < tpl.length) {
      let nextOpen = tpl.indexOf('%FOREACH ', searchPos);
      let nextClose = tpl.indexOf('%ENDFOREACH%', searchPos);
      if (nextClose === -1) break;
      
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        searchPos = nextOpen + 9;
      } else {
        depth--;
        if (depth === 0) {
          innerEnd = nextClose;
          break;
        }
        searchPos = nextClose + 12;
      }
    }
    if (innerEnd === -1) {
      result += tpl.slice(pos);
      break;
    }
    
    let body = tpl.slice(contentStart, innerEnd);
    let list = resolveVar(key, data);
    result += tpl.slice(pos, startIdx);
    
    if (Array.isArray(list) && list.length > 0) {
      result += list.map((item, i) => {
        let out = body
          .replace(/%INDEX%/g, i)
          .replace(/%INDEX_1%/g, i + 1)
          .replace(/%TOTAL%/g, list.length)
          .replace(/%FIRST%/g, i === 0 ? 'true' : '')
          .replace(/%LAST%/g, i === list.length - 1 ? 'true' : '');
          
        let scopedData = typeof item === 'object' && item !== null ? Object.assign({}, data, item) : data;
        out = renderForeach(out, scopedData);
        
        return out.replace(/%([a-zA-Z0-9_.]+)%/g, (m, p) =>
          escapeHtml(String(resolveVar(p, item) ?? resolveVar(p, data) ?? '')));
      }).join('');
    }
    pos = innerEnd + 12;
  }
  return result;
}

const tpl = 'START %FOREACH categories% CATEGORY %name%: %FOREACH cards% CARD %title% %ENDFOREACH% ENDCAT %ENDFOREACH% END';
const data = {
  categories: [
    { name: 'Cat1', cards: [{ title: 'A' }, { title: 'B' }] },
    { name: 'Cat2', cards: [{ title: 'C' }] }
  ]
};
console.log(renderForeach(tpl, data));
