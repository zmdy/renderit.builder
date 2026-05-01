/**
 * Step 4: Carregamento e Edição de Dados
 * Permite a entrada de dados via upload de JSON ou editor visual.
 */

import { state, updateNavButtons } from '../wizard.js';

let currentMode = 'upload'; // 'upload' | 'editor'

/**
 * Renderiza o conteúdo do passo 4
 * @returns {string} HTML string
 */
export function renderStep4() {
  return `
    <div class="max-w-5xl w-full px-8 fade-in flex flex-col gap-6 h-full overflow-hidden">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-text mb-1">Dados do Projeto</h2>
        <p class="text-text-3 text-sm">Importe seus dados ou edite-os diretamente na interface.</p>
      </div>

      <!-- MODE TOGGLE -->
      <div class="flex p-1 bg-surface border border-border rounded-xl self-center mb-2">
        <button id="btn-mode-upload" class="px-6 py-2 rounded-lg text-xs font-bold transition-all ${currentMode === 'upload' ? 'bg-panel text-accent shadow-sm' : 'text-text-3 hover:text-text'}">
          <i class="fa-solid fa-upload mr-2"></i> Upload JSON
        </button>
        <button id="btn-mode-editor" class="px-6 py-2 rounded-lg text-xs font-bold transition-all ${currentMode === 'editor' ? 'bg-panel text-accent shadow-sm' : 'text-text-3 hover:text-text'}">
          <i class="fa-solid fa-pen-to-square mr-2"></i> Editor Visual
        </button>
      </div>

      <!-- CONTENT AREA -->
      <div id="data-content-area" class="flex-1 overflow-y-auto no-scrollbar pb-8">
        ${currentMode === 'upload' ? renderUploadMode() : renderEditorMode()}
      </div>
    </div>
  `;
}

/**
 * Renderiza a interface de Upload
 */
function renderUploadMode() {
  const fileCount = state.finalJson ? '1+ arquivos carregados' : 'Nenhum arquivo carregado';
  
  return `
    <div class="flex flex-col gap-6 fade-in">
      <div id="data-dropzone" class="dropzone-box flex flex-col items-center justify-center border-2 border-dashed border-border py-16 px-6 hover:border-accent hover:bg-accent-dim transition-all cursor-pointer group rounded-2xl">
        <div class="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-2xl text-text-3 mb-4 group-hover:text-accent group-hover:border-accent transition-colors">
          <i class="fa-solid fa-file-export"></i>
        </div>
        <p class="text-text-2 font-medium mb-1">Arraste seu JSON preenchido aqui</p>
        <p class="text-text-3 text-[11px] mb-6">Suporta múltiplos arquivos para merge automático</p>
        
        <button id="btn-select-json" class="px-6 py-2.5 rounded-lg bg-accent text-white font-bold text-xs hover:bg-blue-600 transition-all shadow-lg shadow-accent/10">
          <i class="fa-solid fa-plus mr-2"></i> Selecionar Arquivos
        </button>
        <input type="file" id="input-json" accept=".json" multiple class="hidden">
      </div>

      <div class="bg-surface border border-border rounded-xl p-6">
        <h3 class="text-[11px] font-bold text-text-3 uppercase tracking-widest mb-4">Status da Importação</h3>
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between p-3 bg-panel border border-border rounded-lg">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-circle-info text-accent"></i>
              <span class="text-xs text-text-2">${fileCount}</span>
            </div>
            <span class="text-[10px] text-text-3 font-mono">OK</span>
          </div>
          
          <div id="validation-warnings" class="hidden flex flex-col gap-2">
            <!-- Warnings virão via JS -->
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza o modo Editor Visual (Formulário Dinâmico)
 */
function renderEditorMode() {
  if (!state.finalJson && state.sampleJson) {
    state.finalJson = JSON.parse(JSON.stringify(state.sampleJson));
  }

  if (!state.finalJson) {
    return `<div class="p-8 text-center text-text-3 italic">Nenhum dado disponível para editar. Carregue um JSON ou gere um sample no passo anterior.</div>`;
  }

  return `
    <div class="flex flex-col gap-6 fade-in pb-10">
      <!-- SITE SECTION -->
      ${buildAccordion('🌐 Site', generateFields(state.finalJson.site || {}, 'site'), true)}

      <!-- PAGES SECTION -->
      ${(state.finalJson.pages || []).map((page, idx) => 
        buildAccordion(`📄 Página: ${page.slug || idx}`, generateFields(page, `pages.${idx}`))
      ).join('')}

      <!-- ADDONS / EXTRA DATA -->
      ${Object.keys(state.finalJson)
        .filter(key => !['meta', 'site', 'pages', 'design'].includes(key))
        .map(key => buildAccordion(`📦 ${key.toUpperCase()}`, generateFields(state.finalJson[key], key)))
        .join('')}

      <!-- DESIGN SECTION -->
      <div class="bg-surface border border-border rounded-xl p-6 flex items-center justify-between group hover:border-accent transition-all">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-panel flex items-center justify-center text-accent">
            <i class="fa-solid fa-palette"></i>
          </div>
          <div>
            <h4 class="text-sm font-bold text-text">Design System</h4>
            <p class="text-[11px] text-text-3">Cores, fontes e estilos globais</p>
          </div>
        </div>
        <button id="btn-open-design-editor" class="px-4 py-2 rounded-lg bg-panel border border-border text-xs font-bold text-text hover:text-accent hover:border-accent transition-all">
          Abrir Editor
        </button>
      </div>
    </div>
  `;
}

/**
 * Gera campos de formulário recursivamente
 */
function generateFields(obj, path) {
  return `
    <div class="flex flex-col gap-4 p-4">
      ${Object.entries(obj).map(([key, value]) => {
        const fullPath = path ? `${path}.${key}` : key;
        const label = key.charAt(0).toUpperCase() + key.slice(1);

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return `
            <div class="border-l-2 border-border/30 pl-4 py-2 flex flex-col gap-3">
              <h5 class="text-[10px] font-bold text-text-3 uppercase tracking-widest">${label}</h5>
              ${generateFields(value, fullPath)}
            </div>
          `;
        }

        if (Array.isArray(value)) {
          return `
            <div class="flex flex-col gap-2">
              <label class="text-[11px] font-bold text-text-2">${label} (Lista)</label>
              <div class="p-3 bg-panel/50 rounded-lg border border-border italic text-[10px] text-text-3">
                Edição de arrays disponível no modo JSON (Upload).
              </div>
            </div>
          `;
        }

        const isLong = typeof value === 'string' && value.length > 50;
        
        return `
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-bold text-text-2" for="field-${fullPath}">${label}</label>
            ${isLong 
              ? `<textarea id="field-${fullPath}" data-path="${fullPath}" class="data-field w-full bg-panel border border-border rounded-lg px-3 py-2 text-xs text-text focus:border-accent outline-none min-h-[80px] resize-none" placeholder="Digite ${label.toLowerCase()}...">${value}</textarea>`
              : `<input id="field-${fullPath}" data-path="${fullPath}" type="text" value="${value}" class="data-field w-full bg-panel border border-border rounded-lg px-3 py-2 text-xs text-text focus:border-accent outline-none" placeholder="Digite ${label.toLowerCase()}...">`
            }
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Constrói um componente accordion
 */
function buildAccordion(title, content, expanded = false) {
  return `
    <div class="accordion-item bg-surface border border-border rounded-xl overflow-hidden mb-4">
      <button class="accordion-header w-full px-6 py-4 flex items-center justify-between bg-surface hover:bg-panel transition-colors text-left">
        <span class="text-sm font-bold text-text-2 tracking-tight">${title}</span>
        <i class="fa-solid fa-chevron-down text-[10px] text-text-3 transition-transform ${expanded ? 'rotate-180' : ''}"></i>
      </button>
      <div class="accordion-content ${expanded ? 'block' : 'hidden'} border-t border-border/50 bg-panel/20">
        ${content}
      </div>
    </div>
  `;
}

/**
 * Inicializa os eventos do passo 4
 */
export function initStep4() {
  const btnUpload = document.getElementById('btn-mode-upload');
  const btnEditor = document.getElementById('btn-mode-editor');

  if (btnUpload) btnUpload.addEventListener('click', () => switchMode('upload'));
  if (btnEditor) btnEditor.addEventListener('click', () => switchMode('editor'));

  if (currentMode === 'upload') {
    initUploadEvents();
  } else {
    initEditorEvents();
  }

  validateData();
}

function switchMode(mode) {
  if (currentMode === mode) return;
  currentMode = mode;
  const container = document.getElementById('wizard-container');
  if (container) {
    container.innerHTML = renderStep4();
    initStep4();
  }
}

function initUploadEvents() {
  const dropzone = document.getElementById('data-dropzone');
  const inputJson = document.getElementById('input-json');
  const btnSelect = document.getElementById('btn-select-json');

  if (!dropzone) return;

  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  ['dragleave', 'dragend'].forEach(t => dropzone.addEventListener(t, () => dropzone.classList.remove('dragover')));
  dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); handleJsonFiles(e.dataTransfer.files); });
  
  if (btnSelect) btnSelect.addEventListener('click', () => inputJson.click());
  if (inputJson) inputJson.addEventListener('change', (e) => handleJsonFiles(e.target.files));
}

function initEditorEvents() {
  // Accordion Toggles
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const icon = header.querySelector('.fa-chevron-down');
      content.classList.toggle('hidden');
      if (icon) icon.classList.toggle('rotate-180');
    });
  });

  // Field Synchronization
  document.querySelectorAll('.data-field').forEach(field => {
    field.addEventListener('input', (e) => {
      const path = e.target.dataset.path;
      const value = e.target.value;
      updateDataPath(state.finalJson, path, value);
      validateData();
    });
  });
}

/**
 * Processa arquivos JSON carregados
 */
async function handleJsonFiles(files) {
  const jsonFiles = Array.from(files).filter(f => f.name.endsWith('.json'));
  if (jsonFiles.length === 0) return;

  for (const file of jsonFiles) {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      state.finalJson = state.finalJson ? mergeDeep(state.finalJson, data) : data;
    } catch (e) {
      console.error('Erro ao ler JSON:', file.name);
    }
  }

  const container = document.getElementById('data-content-area');
  if (container) {
    container.innerHTML = renderUploadMode();
    initUploadEvents();
    validateData();
  }
}

/**
 * Atualiza um valor no objeto via string path (ex: "site.url")
 */
function updateDataPath(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Validação simples de campos obrigatórios
 */
function validateData() {
  const warnings = [];
  if (!state.finalJson?.site?.url) warnings.push('Campo site.url está vazio.');
  
  const container = document.getElementById('validation-warnings');
  if (container) {
    if (warnings.length > 0) {
      container.innerHTML = warnings.map(w => `
        <div class="text-[10px] text-warn bg-warn/10 p-2 rounded-lg border border-warn/20 mb-1">
          <i class="fa-solid fa-triangle-exclamation mr-2"></i>${w}
        </div>
      `).join('');
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  }

  updateNavButtons();
}

/**
 * Merge profundo para objetos JSON
 */
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
