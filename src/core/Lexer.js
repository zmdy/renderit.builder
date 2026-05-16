import { ParseError } from './types.js';

/**
 * Converte a string de template em uma sequência plana de tokens.
 * 
 * @param {string} template 
 * @returns {import('./types.js').Token[]}
 */
export function tokenize(template) {
  if (!template) return [];
  const tokens = [];
  let currentPos = 0;
  let currentLine = 1;

  while (currentPos < template.length) {
    const nextPercent = template.indexOf('%', currentPos);

    if (nextPercent === -1) {
      tokens.push(createTextToken(template.slice(currentPos), currentLine));
      break;
    }

    if (nextPercent > currentPos) {
      const text = template.slice(currentPos, nextPercent);
      tokens.push(createTextToken(text, currentLine));
      currentLine += countLines(text);
    }

    if (template[nextPercent + 1] === '%') {
      tokens.push(createTextToken('%', currentLine));
      currentPos = nextPercent + 2;
      continue;
    }

    const endPercent = template.indexOf('%', nextPercent + 1);
    const tagContentRaw = endPercent !== -1 ? template.slice(nextPercent + 1, endPercent) : null;
    
    // Validação heurística: tags válidas não contêm caracteres de CSS/JS/HTML como ;, {}, (), <>, vírgulas ou quebras de linha.
    // Isso evita que % de CSS (ex: 100%) ou funções como translate(-50%, -50%) quebrem o Lexer.
    const isIF = tagContentRaw && tagContentRaw.trim().startsWith('IF ');
    let isInvalidTag = !tagContentRaw || (isIF ? /[;{}[\]\n]/.test(tagContentRaw) : /[;{}[\]\n#&=?,]/.test(tagContentRaw));

    if (!isInvalidTag) {
      const tagContent = tagContentRaw.trim();
      // Variáveis e blocos válidos devem começar com letra ou sublinhado (evita falsos positivos com URL percent-encoding como %2C)
      if (!/^[a-zA-Z_]/.test(tagContent)) {
        isInvalidTag = true;
      }
    }

    if (endPercent === -1 || isInvalidTag) {
      tokens.push(createTextToken('%', currentLine));
      currentPos = nextPercent + 1;
      continue;
    }

    const tagContent = tagContentRaw.trim();
    tokens.push(createTagToken(tagContent, currentLine));
    
    currentLine += countLines(template.slice(nextPercent, endPercent + 1));
    currentPos = endPercent + 1;
  }

  return consolidateTextTokens(tokens);
}

function countLines(str) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\n') count++;
  }
  return count;
}

function createTextToken(value, line) {
  return { type: 'TEXT', value, line };
}

function createTagToken(content, line) {
  if (content === 'ELSE') return { type: 'ELSE', value: 'ELSE', line };
  if (content === 'ENDIF') return { type: 'ENDIF', value: 'ENDIF', line };
  if (content === 'ENDFOREACH') return { type: 'ENDFOREACH', value: 'ENDFOREACH', line };

  if (content.startsWith('FOREACH ')) return { type: 'FOREACH', value: content.slice(8).trim(), line };
  if (content.startsWith('IF ')) return { type: 'IF', value: content.slice(3).trim(), line };
  if (content.startsWith('PARTIAL ')) return { type: 'PARTIAL', value: content.slice(8).trim(), line };
  if (content.startsWith('ADDON ')) return { type: 'ADDON', value: content.slice(6).trim(), line };

  return { type: 'VAR', value: content, line };
}

function consolidateTextTokens(tokens) {
  const result = [];
  for (const token of tokens) {
    if (result.length > 0 && token.type === 'TEXT' && result[result.length - 1].type === 'TEXT') {
      result[result.length - 1].value += token.value;
    } else {
      result.push(token);
    }
  }
  return result;
}
