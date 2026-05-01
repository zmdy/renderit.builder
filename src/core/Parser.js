import { ParseError } from './types.js';

/**
 * Constrói a Abstract Syntax Tree (AST) a partir dos tokens.
 * 
 * @param {import('./types.js').Token[]} tokens 
 * @returns {import('./types.js').ASTNode[]}
 */
export function parse(tokens) {
  const root = { type: 'Root', children: [], line: 1 };
  const stack = [root];

  for (const token of tokens) {
    const parent = stack[stack.length - 1];

    if (token.type === 'TEXT' || token.type === 'VAR' || token.type === 'PARTIAL' || token.type === 'ADDON') {
      appendNode(parent, createLeafNode(token));
    } else if (token.type === 'FOREACH') {
      const node = { type: 'ForEach', path: token.value, children: [], line: token.line };
      appendNode(parent, node);
      stack.push(node);
    } else if (token.type === 'IF') {
      const node = { type: 'If', condition: token.value, children: [], alternate: [], line: token.line };
      appendNode(parent, node);
      stack.push(node);
    } else if (token.type === 'ELSE') {
      handleElse(parent, token);
    } else if (token.type === 'ENDFOREACH') {
      handleEnd('ForEach', stack, token);
    } else if (token.type === 'ENDIF') {
      handleEnd('If', stack, token);
    }
  }

  if (stack.length > 1) {
    const unclosed = stack[stack.length - 1];
    throw new ParseError(`Bloco ${unclosed.type} não fechado no final do arquivo`, { line: unclosed.line });
  }

  return root.children;
}

function createLeafNode(token) {
  const typeMap = { TEXT: 'Text', VAR: 'Var', PARTIAL: 'Partial', ADDON: 'Addon' };
  const node = { type: typeMap[token.type], line: token.line };
  
  if (token.type === 'TEXT') node.value = token.value;
  else if (token.type === 'VAR' || token.type === 'PARTIAL') node.path = token.value;
  else if (token.type === 'ADDON') {
    const parts = token.value.split(' src=');
    node.path = parts[0].trim();
    if (parts[1]) node.src = parts[1].replace(/["']/g, '').trim();
  }
  return node;
}

function appendNode(parent, node) {
  if (parent.type === 'If' && parent.inElse) {
    parent.alternate.push(node);
  } else {
    parent.children.push(node);
  }
}

function handleElse(parent, token) {
  if (parent.type !== 'If') {
    throw new ParseError(`%ELSE% inesperado fora de um bloco IF`, { line: token.line });
  }
  if (parent.inElse) {
    throw new ParseError(`%ELSE% duplicado no bloco IF`, { line: token.line });
  }
  parent.inElse = true;
}

function handleEnd(expectedType, stack, token) {
  const parent = stack[stack.length - 1];
  if (parent.type !== expectedType) {
    const actual = parent.type === 'Root' ? 'vazio' : parent.type;
    throw new ParseError(`%${token.type}% inesperado tentando fechar um bloco ${actual}`, { line: token.line });
  }
  const popped = stack.pop();
  if (popped.type === 'If') delete popped.inElse;
}
