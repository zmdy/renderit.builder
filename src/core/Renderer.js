/**
 * Converte a Abstract Syntax Tree (AST) e os dados em HTML final.
 * 
 * @param {import('./types.js').ASTNode[]} ast 
 * @param {import('./types.js').RenderContext} context 
 * @returns {string}
 */
export function render(ast, context) {
  const output = [];
  const stack = ast.map(node => ({ node, scope: context })).reverse();

  while (stack.length > 0) {
    const { node, scope } = stack.pop();

    if (node.type === 'Text') {
      output.push(node.value);
    } else if (node.type === 'Var') {
      output.push(escapeHtml(resolveVar(node.path, scope)));
    } else if (node.type === 'If') {
      const cond = evaluateCondition(node.condition, scope);
      const children = cond ? node.children : node.alternate;
      if (children && children.length > 0) {
        for (let i = children.length - 1; i >= 0; i--) {
          stack.push({ node: children[i], scope });
        }
      }
    } else if (node.type === 'ForEach') {
      const list = resolveArray(node.path, scope);
      for (let i = list.length - 1; i >= 0; i--) {
        const itemScope = { data: scope.data, localData: list[i], index: i, total: list.length };
        for (let j = node.children.length - 1; j >= 0; j--) {
          stack.push({ node: node.children[j], scope: itemScope });
        }
      }
    }
  }

  return output.join('');
}

function resolveVar(path, scope) {
  if (path === 'YEAR') return new Date().getFullYear().toString();
  if (path === 'BUILD_DATE') return new Date().toISOString();
  if (path === 'VERSION') return String(resolvePath('meta.version', scope.data) || '');
  if (path === 'SITE_NAME') return String(resolvePath('site.name', scope.data) || '');
  if (path === 'SITE_URL') return String(resolvePath('site.url', scope.data) || '');

  if (path === 'INDEX' && scope.index !== undefined) return String(scope.index);
  if (path === 'INDEX_1' && scope.index !== undefined) return String(scope.index + 1);
  if (path === 'TOTAL' && scope.total !== undefined) return String(scope.total);
  if (path === 'FIRST' && scope.index !== undefined) return scope.index === 0 ? 'true' : 'false';
  if (path === 'LAST' && scope.index !== undefined) return scope.index === scope.total - 1 ? 'true' : 'false';

  let val = resolvePath(path, scope.localData);
  if (val !== undefined && val !== null) return String(val);

  val = resolvePath(path, scope.data);
  if (val !== undefined && val !== null) return String(val);

  return '';
}

function resolvePath(path, obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

function resolveArray(path, scope) {
  let val = resolvePath(path, scope.localData);
  if (Array.isArray(val)) return val;
  val = resolvePath(path, scope.data);
  if (Array.isArray(val)) return val;
  return [];
}

function evaluateCondition(condStr, scope) {
  const match = condStr.match(/(.+?)\s*(==|!=)\s*(.+)/);
  if (match) {
    const leftVal = resolveVar(match[1].trim(), scope);
    const rightVal = match[3].trim().replace(/^["']|["']$/g, '');
    if (match[2] === '==') return leftVal === rightVal;
    if (match[2] === '!=') return leftVal !== rightVal;
  }
  const val = resolveVar(condStr.trim(), scope);
  return val !== '' && val !== 'false' && val !== '0';
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, match => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[match];
  });
}
