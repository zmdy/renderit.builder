/**
 * Step 3: JSON de Sample
 * Gera e exibe uma amostra do JSON necessário para alimentar os templates carregados.
 */

import { state } from '../wizard.js';
import { generateSample } from '../../src/utils/SampleGenerator.js';

let editor = null;

/**
 * Renderiza o conteúdo do passo 3
 * @returns {string} HTML string
 */
export function renderStep3() {
  const mode = state.jsonMode || 'single';

  return `
    <div class="max-w-5xl w-full px-8 fade-in flex flex-col gap-8">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-text mb-2">Como você quer organizar os dados?</h2>
        <p class="text-text-3">Escolha a estrutura que melhor se adapta ao seu fluxo de trabalho.</p>
      </div>

      <!-- JSON MODE SELECTION -->
      <div class="flex flex-col md:flex-row gap-4 justify-center">
        <label class="flex-1 flex items-center gap-4 p-4 bg-surface border border-border rounded-xl cursor-pointer hover:border-accent transition-all group ${mode === 'single' ? 'ring-1 ring-accent border-accent' : ''}">
          <input type="radio" name="json-mode" value="single" class="hidden" ${mode === 'single' ? 'checked' : ''}>
          <div class="w-10 h-10 rounded-lg bg-panel flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
            <i class="fa-solid fa-file-invoice"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-text">Arquivo Único</span>
            <span class="text-[11px] text-text-3">Um único JSON para todo o site</span>
          </div>
          <i class="fa-solid fa-circle-check ml-auto text-accent ${mode === 'single' ? 'opacity-100' : 'opacity-0'}"></i>
        </label>

        <label class="flex-1 flex items-center gap-4 p-4 bg-surface border border-border rounded-xl cursor-pointer hover:border-accent transition-all group ${mode === 'per-page' ? 'ring-1 ring-accent border-accent' : ''}">
          <input type="radio" name="json-mode" value="per-page" class="hidden" ${mode === 'per-page' ? 'checked' : ''}>
          <div class="w-10 h-10 rounded-lg bg-panel flex items-center justify-center text-success group-hover:bg-success group-hover:text-white transition-all">
            <i class="fa-solid fa-copy"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-text">Por Página</span>
            <span class="text-[11px] text-text-3">JSON individual + site.json global</span>
          </div>
          <i class="fa-solid fa-circle-check ml-auto text-accent ${mode === 'per-page' ? 'opacity-100' : 'opacity-0'}"></i>
        </label>
      </div>

      <!-- PREVIEW AREA -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-[11px] font-bold text-text-3 uppercase tracking-widest">Sample Preview (Read-only)</h3>
          <span class="text-[10px] bg-panel px-2 py-0.5 rounded border border-border text-text-3 font-mono">JSON Format</span>
        </div>
        
        <div class="h-[400px] bg-surface border border-border rounded-xl overflow-hidden relative group">
          <div id="sample-editor" class="h-full w-full"></div>
          
          <div class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button id="btn-download-sample" class="px-3 py-1.5 rounded-lg bg-panel border border-border text-text text-[11px] font-bold hover:border-accent transition-all">
              <i class="fa-solid fa-download mr-2"></i> Baixar Sample
            </button>
            <button id="btn-edit-sample" class="px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-bold hover:bg-blue-600 transition-all shadow-lg shadow-accent/20">
              <i class="fa-solid fa-pen-to-square mr-2"></i> Editar aqui →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Inicializa os eventos do passo 3
 */
export function initStep3() {
  const container = document.getElementById('sample-editor');
  if (!container) return;

  // Inicializa CodeMirror (Global de index.html)
  editor = CodeMirror(container, {
    mode: { name: "javascript", json: true },
    theme: "material-ocean",
    lineNumbers: true,
    readOnly: true,
    tabSize: 2,
    viewportMargin: Infinity
  });

  // Listeners para troca de modo
  const radios = document.querySelectorAll('input[name="json-mode"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.jsonMode = e.target.value;
      
      // Atualiza visual das labels
      document.querySelectorAll('label').forEach(l => l.classList.remove('ring-1', 'ring-accent', 'border-accent'));
      e.target.closest('label').classList.add('ring-1', 'ring-accent', 'border-accent');
      document.querySelectorAll('.fa-circle-check').forEach(i => i.classList.add('opacity-0'));
      e.target.closest('label').querySelector('.fa-circle-check').classList.remove('opacity-0');

      updateSample();
    });
  });

  // Listeners para botões de ação
  const btnDownload = document.getElementById('btn-download-sample');
  const btnEdit = document.getElementById('btn-edit-sample');

  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const data = JSON.stringify(state.sampleJson, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = state.jsonMode === 'per-page' ? 'sample-package.json' : 'sample.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      state.finalJson = state.sampleJson;
      import('../wizard.js').then(m => m.nextStep());
    });
  }

  // Geração inicial
  updateSample();
}

/**
 * Gera o JSON e atualiza o editor
 */
function updateSample() {
  if (!editor) return;

  const options = { splitPages: state.jsonMode === 'per-page' };
  const validAddons = (state.detectedAddons || []).filter(a => a.content);
  const sample = generateSample(state.templates, validAddons, options);
  
  state.sampleJson = sample;
  editor.setValue(JSON.stringify(sample, null, 2));
  
  setTimeout(() => editor.refresh(), 10);
}
