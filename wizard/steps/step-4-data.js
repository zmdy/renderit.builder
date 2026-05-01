/**
 * Step 4: Carregamento e Edição de Dados
 * Permite a entrada de dados via upload de JSON ou editor visual.
 */

import { state, updateNavButtons } from '../wizard.js';
import { JsonEditor } from '../json-editor/JsonEditor.js';

let currentMode = 'upload'; // 'upload' | 'editor'
let jsonEditor = null;

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
          
          <div id="validation-warnings" class="hidden flex flex-col gap-2"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza a interface do Editor Visual
 */
function renderEditorMode() {
  if (!state.finalJson && state.sampleJson) {
    state.finalJson = JSON.parse(JSON.stringify(state.sampleJson));
  }

  if (!state.finalJson) {
    return `<div class="p-8 text-center text-text-3 italic">Nenhum dado disponível para editar.</div>`;
  }

  return `<div id="json-editor-container" class="fade-in"></div>`;
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
  const container = document.getElementById('json-editor-container');
  if (!container) return;

  if (!jsonEditor) {
    jsonEditor = new JsonEditor({
      onChange: (newData) => {
        state.finalJson = newData;
        validateData();
      }
    });
  }

  jsonEditor.render(state.finalJson, container);
}

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
