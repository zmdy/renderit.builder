/**
 * renderit.builder — Tipos Core
 * 
 * Este arquivo define as classes de erro nativas e os contratos JSDoc
 * para comunicação entre os módulos do engine.
 */

export class ParseError extends Error {
  /**
   * Erro lançado durante a tokenização (Lexer) ou construção da árvore (Parser)
   * 
   * @param {string} message - Mensagem descritiva do erro
   * @param {Object} options
   * @param {number} [options.line] - Número da linha onde o erro ocorreu
   * @param {string} [options.context] - Trecho de código relacionado ao erro
   */
  constructor(message, { line, context } = {}) {
    super(message);
    this.name = 'ParseError';
    this.line = line;
    this.context = context;
  }
}

export class AddonError extends Error {
  /**
   * Erro lançado durante a resolução ou carregamento de Addons
   * 
   * @param {string} message - Mensagem descritiva
   * @param {Object} options
   * @param {string} [options.addonName] - Nome do addon que falhou
   */
  constructor(message, { addonName } = {}) {
    super(message);
    this.name = 'AddonError';
    this.addonName = addonName;
  }
}

// ============================================================================
// CONTRATOS DE TIPOS (JSDoc)
// ============================================================================

/**
 * @typedef {Object} Token
 * @property {string} type - Tipo do token (ex: 'TEXT', 'VAR', 'FOREACH', 'ENDFOREACH', 'IF', 'ELSE', 'ENDIF', 'PARTIAL', 'ADDON')
 * @property {string} value - O conteúdo bruto ou path extraído
 * @property {number} line - A linha onde o token foi encontrado
 */

/**
 * @typedef {Object} ASTNode
 * @property {string} type - Tipo do nó (ex: 'Root', 'Text', 'Var', 'ForEach', 'If', 'Partial', 'Addon')
 * @property {string} [value] - O valor textual (para nós tipo Text)
 * @property {string} [path] - Caminho da variável no JSON (ex: 'content.hero.title')
 * @property {ASTNode[]} [children] - Nós filhos (para Root, ForEach, If)
 * @property {ASTNode[]} [alternate] - Nós filhos do bloco ELSE (para If)
 * @property {string} [condition] - Condição avaliada (para If)
 * @property {string} [src] - Atributo source opcional para addons (ex: path/dados.json)
 * @property {number} line - Linha original do template de onde o nó originou
 */

/**
 * @typedef {Object} AddonDefinition
 * @property {string} name - Nome do addon (ex: 'whatsapp')
 * @property {string} content - HTML bruto do addon (template)
 * @property {string} [src] - Caminho do JSON embutido opcional
 */

/**
 * @typedef {Object} TemplateFile
 * @property {string} name - Nome do arquivo (ex: 'index.html')
 * @property {string} content - Conteúdo HTML em string
 */

/**
 * @typedef {Object} EngineConfig
 * @property {TemplateFile[]} templates - Arquivos de template a serem processados
 * @property {Object} data - O JSON com os dados completos do site e design
 * @property {AddonDefinition[]} [addons] - Array de addons já resolvidos
 * @property {string} [mode='static'] - Modo de build ('static', 'live', 'manager')
 * @property {string} [outputName='renderit-site'] - Nome do arquivo final/projeto
 */

/**
 * @typedef {Object} RenderContext
 * @property {Object} data - Objeto de dados raiz
 * @property {Object} [localData] - Dados locais de escopo de loop ou partial
 * @property {string} [managerPrefix] - Prefixo gerado para os atributos renderit_manager_area (Modo Manager)
 * @property {number} [index] - Índice atual em caso de loop
 * @property {number} [total] - Total de itens no loop atual
 */
