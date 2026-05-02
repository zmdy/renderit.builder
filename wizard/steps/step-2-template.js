/**
 * Step 2: Carregamento de Template
 * Gerencia a ingestão de arquivos HTML e a detecção de addons.
 */

import { state } from '../wizard.js';
import { scanTemplate } from '../../src/utils/AddonScanner.js';
import { THEMES_REPO } from '../config.js';

/**
 * Renderiza o conteúdo do passo 2
 * @returns {string} HTML string
 */
export function renderStep2() {
  return `
    <div id="step-2-container" class="max-w-5xl w-full px-8 fade-in flex flex-col items-center gap-10 ${state.templates.length > 0 ? 'py-8' : 'flex-1 justify-center'}">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-text mb-2">Carregue seu template</h2>
        <p class="text-text-3">Arraste seus arquivos .html ou uma pasta inteira para começar.</p>
      </div>

      <!-- DROPZONE -->
      <div id="dropzone" class="dropzone-box w-full max-w-2xl ${state.templates.length > 0 ? 'hidden' : 'flex'} flex-col items-center justify-center border-2 border-dashed border-border py-12 px-6 hover:border-accent hover:bg-accent-dim transition-all cursor-pointer group">
        <div class="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-2xl text-text-3 mb-4 group-hover:text-accent group-hover:border-accent transition-colors">
          <i class="fa-regular fa-folder-open"></i>
        </div>
        <p class="text-text-2 font-medium mb-1">Arraste arquivos ou pastas aqui</p>
        <p class="text-text-3 text-[11px] mb-6">Apenas arquivos .html serão processados</p>
        
        <div class="flex gap-3">
          <button id="btn-select-files" class="px-4 py-2 rounded-lg bg-panel border border-border text-text font-medium text-xs hover:border-accent hover:text-accent transition-all">
            <i class="fa-solid fa-file-code mr-2"></i> Selecionar Arquivos
          </button>
          <button id="btn-select-folder" class="px-4 py-2 rounded-lg bg-accent text-white font-medium text-xs hover:bg-blue-600 transition-all shadow-lg shadow-accent/10">
            <i class="fa-solid fa-folder-tree mr-2"></i> Abrir Pasta
          </button>
        </div>

        <!-- Hidden inputs -->
        <input type="file" id="input-files" accept=".html" multiple class="hidden">
        <input type="file" id="input-folder" webkitdirectory directory multiple class="hidden">
      </div>

      <div id="results-area" class="${state.templates.length > 0 ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 gap-8 h-[300px]">
        <!-- FILE LIST -->
        <div class="flex flex-col gap-3">
          <h3 class="text-[11px] font-bold text-text-3 uppercase tracking-widest px-1">Arquivos carregados</h3>
          <div id="file-list" class="flex-1 bg-surface border border-border rounded-xl p-4 overflow-y-auto no-scrollbar flex flex-col gap-2">
            ${renderFileList()}
          </div>
        </div>

        <!-- ADDON LIST -->
        <div class="flex flex-col gap-3">
          <h3 class="text-[11px] font-bold text-text-3 uppercase tracking-widest px-1">Addons detectados</h3>
          <div id="addon-list" class="flex-1 bg-surface border border-border rounded-xl p-4 overflow-y-auto no-scrollbar flex flex-col gap-2">
            ${renderAddonList()}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza a lista de arquivos carregados
 */
export function renderFileList() {
  if (state.templates.length === 0) {
    return `<div class="h-full flex items-center justify-center text-text-3 italic text-xs">Nenhum arquivo carregado</div>`;
  }

  return state.templates.map((file, index) => `
    <div class="flex items-center justify-between p-3 bg-panel border border-border rounded-lg group hover:border-border-bright transition-colors">
      <div class="flex items-center gap-3 overflow-hidden">
        <i class="fa-solid fa-file-code text-accent"></i>
        <div class="flex flex-col overflow-hidden">
          <span class="text-xs font-medium text-text truncate">${file.name}</span>
          <span class="text-[10px] text-text-3">${(file.content.length / 1024).toFixed(1)} KB</span>
        </div>
      </div>
      <button class="btn-remove-file p-2 text-text-3 hover:text-danger opacity-0 group-hover:opacity-100 transition-all" data-index="${index}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');
}

/**
 * Renderiza a lista de addons detectados
 */
export function renderAddonList() {
  if (state.detectedAddons.length === 0) {
    return `<div class="h-full flex items-center justify-center text-text-3 italic text-xs">Nenhum addon detectado</div>`;
  }

  return state.detectedAddons.map(addon => {
    let statusIcon = 'fa-circle-check text-success';
    let statusText = 'Encontrado localmente';
    let badgeClass = 'bg-success/10 text-success';

    if (addon.status === 'remote') {
      statusIcon = 'fa-globe text-accent';
      statusText = 'Será baixado do GitHub';
      badgeClass = 'bg-accent/10 text-accent';
    } else if (addon.status === 'missing') {
      statusIcon = 'fa-circle-xmark text-danger';
      statusText = 'Não encontrado';
      badgeClass = 'bg-danger/10 text-danger';
    }

    return `
      <div class="flex items-center justify-between p-3 bg-panel border border-border rounded-lg">
        <div class="flex items-center gap-3">
          <i class="fa-solid ${statusIcon}"></i>
          <span class="text-xs font-mono font-bold text-text-2 uppercase tracking-tighter">${addon.name}</span>
        </div>
        <span class="px-2 py-0.5 rounded ${badgeClass} text-[9px] font-bold uppercase tracking-wider">
          ${statusText}
        </span>
      </div>
    `;
  }).join('');
}

/**
 * Inicializa os eventos do passo 2
 */
export function initStep2() {
  const dropzone = document.getElementById('dropzone');
  const inputFiles = document.getElementById('input-files');
  const inputFolder = document.getElementById('input-folder');
  const btnSelectFiles = document.getElementById('btn-select-files');
  const btnSelectFolder = document.getElementById('btn-select-folder');

  if (!dropzone) return;

  // Drag & Drop events
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  ['dragleave', 'dragend'].forEach(type => {
    dropzone.addEventListener(type, () => dropzone.classList.remove('dragover'));
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  // Manual selection events
  btnSelectFiles.addEventListener('click', () => inputFiles.click());
  btnSelectFolder.addEventListener('click', () => inputFolder.click());

  inputFiles.addEventListener('change', (e) => handleFiles(e.target.files));
  inputFolder.addEventListener('change', (e) => handleFiles(e.target.files));
}

/**
 * Processa os arquivos recebidos
 * @param {FileList|File[]} files 
 */
async function handleFiles(files) {
  const htmlFiles = Array.from(files).filter(file => file.name.endsWith('.html'));
  
  if (htmlFiles.length === 0) {
    alert('Por favor, selecione apenas arquivos .html');
    return;
  }

  const results = await Promise.all(htmlFiles.map(readFile));
  
  // Adiciona ao estado, evitando duplicatas por nome
  results.forEach(newFile => {
    const exists = state.templates.find(f => f.name === newFile.name);
    if (!exists) {
      state.templates.push(newFile);
    }
  });

  await auditAddons();
  refreshUI();
}

/**
 * Escaneia todos os templates e verifica o status de cada addon detectado
 */
async function auditAddons() {
  const allAddons = [];
  
  // Coleta addons de todos os templates
  state.templates.forEach(tpl => {
    const detected = scanTemplate(tpl.content);
    detected.forEach(d => {
      if (!allAddons.find(a => a.name === d.name)) {
        allAddons.push({ name: d.name, status: 'checking' });
      }
    });
  });

  // Verifica status de cada um e baixa o conteúdo
  const results = await Promise.all(allAddons.map(async addon => {
    try {
      // 1. Tentar local (relativo ao builder)
      const localRes = await fetch(`./addons/${addon.name}.html`);
      if (localRes.ok) return { ...addon, status: 'local', content: await localRes.text() };

      // 2. Tentar GitHub
      const githubRes = await fetch(`${THEMES_REPO.addonsBaseUrl}/${addon.name}.html`);
      if (githubRes.ok) return { ...addon, status: 'remote', content: await githubRes.text() };

      return { ...addon, status: 'missing' };
    } catch (e) {
      return { ...addon, status: 'missing' };
    }
  }));

  state.detectedAddons = results;
}

/**
 * Lê o conteúdo de um arquivo
 * @param {File} file 
 * @returns {Promise<{name: string, content: string}>}
 */
function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        name: file.name,
        content: e.target.result
      });
    };
    reader.readAsText(file);
  });
}

/**
 * Atualiza os containers de lista na UI
 */
function refreshUI() {
  const fileList = document.getElementById('file-list');
  const addonList = document.getElementById('addon-list');
  const dropzone = document.getElementById('dropzone');
  const resultsArea = document.getElementById('results-area');
  const container = document.getElementById('step-2-container');
  const hasFiles = state.templates.length > 0;

  if (fileList) fileList.innerHTML = renderFileList();
  if (addonList) addonList.innerHTML = renderAddonList();
  
  if (dropzone && resultsArea && container) {
    if (hasFiles) {
      dropzone.classList.add('hidden');
      dropzone.classList.remove('flex');
      resultsArea.classList.remove('hidden');
      resultsArea.classList.add('grid');
      container.classList.remove('flex-1', 'justify-center');
      container.classList.add('py-8');
    } else {
      dropzone.classList.remove('hidden');
      dropzone.classList.add('flex');
      resultsArea.classList.add('hidden');
      resultsArea.classList.remove('grid');
      container.classList.add('flex-1', 'justify-center');
      container.classList.remove('py-8');
    }
  }

  // Re-bind remove buttons
  document.querySelectorAll('.btn-remove-file').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = e.currentTarget.dataset.index;
      state.templates.splice(index, 1);
      await auditAddons();
      refreshUI();
    });
  });

  import('../wizard.js').then(m => m.updateNavButtons());
}
