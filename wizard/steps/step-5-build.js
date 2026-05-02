/**
 * Step 5: Build e Download
 * Orquestra o processamento final e a geração do ZIP.
 */

import { state, updateNavButtons } from '../wizard.js';
import { tokenize } from '../../src/core/Lexer.js';
import { parse } from '../../src/core/Parser.js';
import { render } from '../../src/core/Renderer.js';
import { buildStatic } from '../../src/modes/StaticMode.js';
import { buildManager } from '../../src/modes/ManagerMode.js';
import { buildLive } from '../../src/modes/LiveMode.js';
import { THEMES_REPO } from '../config.js';

let buildLogs = [];
let progress = 0;
let buildStatus = 'idle'; // 'idle' | 'building' | 'success' | 'error'
let resultBlob = null;

/**
 * Renderiza o conteúdo do passo 5
 */
export function renderStep5() {
  const pageCount = state.finalJson?.pages?.length || 0;
  const addonCount = state.templates?.filter(f => f.name.includes('.addon.')).length || 0;
  
  return `
    <div class="max-w-5xl w-full px-8 fade-in flex flex-col gap-6 h-full overflow-hidden">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-text mb-1">Finalizar Projeto</h2>
        <p class="text-text-3 text-sm">Tudo pronto para gerar os arquivos finais do seu site.</p>
      </div>

      <!-- RESUMO DO BUILD -->
      <div class="grid grid-cols-3 gap-4">
        ${renderSummaryCard('Modo', state.mode?.toUpperCase() || 'STATIC', 'fa-layer-group')}
        ${renderSummaryCard('Páginas', pageCount, 'fa-file-lines')}
        ${renderSummaryCard('Addons', addonCount, 'fa-plug-circle-check')}
      </div>

      <!-- PAINEL DE CONTROLE / PROGRESSO -->
      <div class="flex-1 bg-surface border border-border rounded-2xl p-8 flex flex-col gap-6 overflow-hidden shadow-sm">
        ${buildStatus === 'idle' ? renderIdleState() : renderBuildState()}
      </div>

      <!-- AÇÕES FINAIS -->
      <div id="build-actions" class="flex justify-center gap-4 pb-8 ${buildStatus === 'success' ? '' : 'hidden'}">
        <button id="btn-download-zip" class="px-8 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-accent/20">
          <i class="fa-solid fa-file-zipper mr-2"></i> Download ZIP
        </button>
        <button id="btn-new-build" class="px-8 py-3 rounded-xl bg-panel border border-border text-text font-bold text-sm hover:border-accent transition-all">
          <i class="fa-solid fa-rotate-right mr-2"></i> Novo Build
        </button>
      </div>
    </div>
  `;
}

function renderSummaryCard(label, value, icon) {
  return `
    <div class="bg-panel border border-border p-4 rounded-xl flex items-center gap-4">
      <div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-accent border border-border/50">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div>
        <p class="text-[10px] font-bold text-text-3 uppercase tracking-widest">${label}</p>
        <p class="text-sm font-bold text-text">${value}</p>
      </div>
    </div>
  `;
}

function renderIdleState() {
  return `
    <div class="flex-1 flex flex-col items-center justify-center text-center fade-in">
      <div class="w-20 h-20 rounded-full bg-accent/5 flex items-center justify-center text-3xl text-accent mb-6 border border-accent/10">
        <i class="fa-solid fa-rocket"></i>
      </div>
      <h3 class="text-lg font-bold text-text mb-2">Tudo pronto para a decolagem!</h3>
      <p class="text-text-3 text-sm max-w-md mb-8">Clique no botão abaixo para iniciar o processamento dos templates e geração dos arquivos.</p>
      <button id="btn-start-build" class="px-10 py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-blue-600 transition-all shadow-2xl shadow-accent/30 hover:scale-105 active:scale-95">
        Gerar Site Agora
      </button>
    </div>
  `;
}

function renderBuildState() {
  return `
    <div class="flex-1 flex flex-col gap-6 overflow-hidden fade-in">
      <!-- PROGRESS BAR -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-end">
          <span class="text-xs font-bold text-text-2 uppercase tracking-widest" id="build-status-text">
            ${buildStatus === 'building' ? 'Processando...' : buildStatus === 'error' ? 'Falha no Build' : 'Build Concluído'}
          </span>
          <span class="text-xs font-mono text-accent font-bold" id="build-percent">${progress}%</span>
        </div>
        <div class="h-2 w-full bg-panel rounded-full overflow-hidden border border-border/50">
          <div id="build-progress-bar" class="h-full ${buildStatus === 'error' ? 'bg-danger' : 'bg-accent'} transition-all duration-300" style="width: ${progress}%"></div>
        </div>
      </div>

      <!-- LOGS -->
      <div id="build-log-container" class="flex-1 bg-panel/50 border border-border rounded-xl p-4 font-mono text-[11px] overflow-y-auto no-scrollbar">
        ${buildLogs.map(log => `
          <div class="flex gap-3 mb-1.5 animate-slide-in">
            <span class="text-text-3 opacity-50">[${log.time}]</span>
            <span class="${log.type === 'error' ? 'text-danger' : log.type === 'success' ? 'text-accent' : 'text-text-2'}">${log.msg}</span>
          </div>
        `).join('')}
        ${buildStatus === 'building' ? '<div class="text-accent animate-pulse">_</div>' : ''}
      </div>

      <!-- PREVIEW AREA -->
      <div id="preview-area" class="${buildStatus === 'success' ? 'flex' : 'hidden'} h-80 border border-border rounded-xl overflow-hidden bg-panel flex-col">
        <div class="px-4 py-2 border-b border-border bg-surface flex items-center justify-between">
          <div class="flex items-center gap-2">
             <i class="fa-solid fa-eye text-accent text-[10px]"></i>
             <span class="text-[10px] font-bold text-text-3 uppercase tracking-widest" id="preview-filename">index.html</span>
          </div>
          <div id="page-selector-container"></div>
        </div>
        <div class="flex-1 relative bg-white">
           <iframe id="build-preview-iframe" class="w-full h-full border-none" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
        </div>
      </div>
    </div>
  `;
}

/**
 * Inicializa os eventos do passo 5
 */
export function initStep5() {
  const btnStart = document.getElementById('btn-start-build');
  if (btnStart) btnStart.onclick = () => startBuildFlow();

  const btnDownload = document.getElementById('btn-download-zip');
  if (btnDownload) btnDownload.onclick = () => downloadZip();

  const btnNewBuild = document.getElementById('btn-new-build');
  if (btnNewBuild) btnNewBuild.onclick = () => {
    buildLogs = [];
    progress = 0;
    buildStatus = 'idle';
    resultBlob = null;
    updateUI();
  };

  if (buildStatus === 'success') initPreview();
  updateNavButtons();
}

function updateUI() {
  const container = document.getElementById('wizard-container');
  if (container) {
    container.innerHTML = renderStep5();
    initStep5();
  }
}

/**
 * Orquestra o fluxo de build real
 */
async function startBuildFlow() {
  buildStatus = 'building';
  buildLogs = [];
  progress = 0;
  addLog('Iniciando pipeline de build...');
  updateUI();

  try {
    const config = prepareBuildConfig();
    let blob;
    if (state.mode === 'manager') blob = await buildManager(config);
    else if (state.mode === 'live') blob = await buildLive(config);
    else blob = await buildStatic(config);

    resultBlob = blob;
    buildStatus = 'success';
    progress = 100;
    addLog('Pacote gerado com sucesso!', 'success');
  } catch (error) {
    console.error(error);
    buildStatus = 'error';
    addLog(`ERRO: ${error.message}`, 'error');
  }
  updateUI();
}

function prepareBuildConfig() {
  const templates = {};
  state.templates.forEach(file => {
    const slug = file.name.replace('.html', '');
    templates[slug] = file.content;
  });

  return {
    data: state.finalJson,
    templates,
    assets: state.assets || {},
    themesRepoUrl: `${THEMES_REPO.addonsBaseUrl}`.replace('/addons', ''),
    onProgress: (event, payload) => handleBuildProgress(event, payload)
  };
}

function handleBuildProgress(event, payload) {
  const eventMap = {
    'start': { msg: `Modo ${payload.mode} iniciado.`, p: 5 },
    'page_start': { msg: `Renderizando ${payload.slug}...`, p: 20 },
    'resolving_addons': { msg: `Processando addons: ${payload.slug}`, p: 40 },
    'parsing': { msg: `Analisando template: ${payload.slug}`, p: 60 },
    'page_done': { msg: `Renderização de ${payload.slug} concluída.`, p: 70 },
    'seo_generation': { msg: 'Gerando arquivos SEO...', p: 85 },
    'asset_scanning': { msg: 'Sincronizando assets...', p: 90 },
    'zipping': { msg: 'Finalizando pacote ZIP...', p: 95 }
  };

  const info = eventMap[event];
  if (info) {
    addLog(info.msg);
    progress = info.p;
    updateUI();
  }
}

function addLog(msg, type = 'info') {
  buildLogs.push({ 
    msg, type, 
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
  });
}

function downloadZip() {
  if (!resultBlob) return;
  const url = URL.createObjectURL(resultBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `site-${state.finalJson?.site?.name || 'build'}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

function initPreview() {
  const selectorContainer = document.getElementById('page-selector-container');
  const slugs = state.templates
    .filter(f => !f.name.includes('.addon.'))
    .map(f => f.name.replace('.html', ''));

  if (slugs.length > 1 && selectorContainer) {
    selectorContainer.innerHTML = `
      <select id="preview-page-select" class="bg-panel border border-border rounded px-2 py-1 text-[10px] text-text outline-none focus:border-accent">
        ${slugs.map(slug => `<option value="${slug}">${slug}.html</option>`).join('')}
      </select>
    `;
    const select = document.getElementById('preview-page-select');
    select.onchange = () => renderPreviewPage(select.value);
  }

  renderPreviewPage(slugs[0] || 'index');
}

function renderPreviewPage(slug) {
  const iframe = document.getElementById('build-preview-iframe');
  const filenameLabel = document.getElementById('preview-filename');
  if (!iframe) return;

  const file = state.templates.find(f => f.name === `${slug}.html`);
  if (!file) return;

  try {
    const tokens = tokenize(file.content);
    const ast = parse(tokens);
    const html = render(ast, { data: state.finalJson });

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    if (filenameLabel) filenameLabel.innerText = `${slug}.html`;
  } catch (e) {
    console.error('Erro no preview:', e);
  }
}
