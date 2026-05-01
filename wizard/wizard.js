/**
 * renderit.builder — Wizard Controller
 * Gerencia o estado global e a navegação da interface.
 */

import { WIZARD_STEPS } from './config.js';
import { renderStep1, initStep1 } from './steps/step-1-mode.js';
import { renderStep2, initStep2 } from './steps/step-2-template.js';
import { renderStep3, initStep3 } from './steps/step-3-sample.js';
import { renderStep4, initStep4 } from './steps/step-4-data.js';

// Estado global da sessão de build
export const state = {
  mode: null,               // 'static' | 'live' | 'manager'
  templates: [],            // Array de { name, content } dos HTMLs carregados
  detectedAddons: [],       // Nomes dos addons encontrados no template
  resolvedAddons: {},       // Map nome → HTML do addon
  jsonMode: null,           // 'single' | 'per-page'
  sampleJson: null,         // JSON de sample gerado
  finalJson: null,          // JSON final preenchido pelo usuário
  buildResult: null,        // Blob do ZIP gerado
  currentStep: 0,           // Índice do step atual (0–4)
  errors: []                // Erros acumulados durante o fluxo
};

/**
 * Salta para um passo específico
 * @param {number} index 
 */
export function goToStep(index) {
  if (index < 0 || index >= WIZARD_STEPS.length) return;
  
  state.currentStep = index;
  renderCurrentStep();
  updateStepIndicator();
  updateNavButtons();
}

/**
 * Avança para o próximo passo
 */
export function nextStep() {
  if (state.currentStep < WIZARD_STEPS.length - 1) {
    goToStep(state.currentStep + 1);
  }
}

/**
 * Volta para o passo anterior
 */
export function prevStep() {
  if (state.currentStep > 0) {
    goToStep(state.currentStep - 1);
  }
}

/**
 * Reinicia o Wizard para o estado inicial
 */
export function resetWizard() {
  if (confirm('Tem certeza que deseja recomeçar? Todos os dados não salvos serão perdidos.')) {
    window.location.reload();
  }
}

/**
 * Renderiza o conteúdo do passo atual no container
 */
function renderCurrentStep() {
  const container = document.getElementById('wizard-container');
  if (!container) return;

  // Lógica de roteamento de passos
  switch (state.currentStep) {
    case 0:
      container.innerHTML = renderStep1();
      initStep1();
      break;

    case 1:
      container.innerHTML = renderStep2();
      initStep2();
      break;

    case 2:
      container.innerHTML = renderStep3();
      initStep3();
      break;

    case 3:
      container.innerHTML = renderStep4();
      initStep4();
      break;

    default:
      const stepName = WIZARD_STEPS[state.currentStep];
      container.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center fade-in">
          <h2 class="text-2xl font-bold text-text-3 uppercase tracking-widest opacity-20">${stepName}</h2>
        </div>
      `;
  }
}

/**
 * Atualiza o indicador visual de passos no header
 */
function updateStepIndicator() {
  const label = document.getElementById('step-label');
  const dotsContainer = document.getElementById('step-indicator-dots');
  
  if (label) {
    label.textContent = `${state.currentStep + 1} / ${WIZARD_STEPS.length}`;
  }

  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('div');
    dots.forEach((dot, idx) => {
      if (idx === state.currentStep) {
        dot.className = 'w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--re-accent)]';
      } else if (idx < state.currentStep) {
        dot.className = 'w-2 h-2 rounded-full bg-accent opacity-50';
      } else {
        dot.className = 'w-2 h-2 rounded-full bg-border';
      }
    });
  }
}

/**
 * Atualiza o estado dos botões de navegação no footer
 */
export function updateNavButtons() {
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  if (btnPrev) {
    btnPrev.disabled = state.currentStep === 0;
  }

  if (btnNext) {
    // No passo final (Build), o botão Next pode mudar de texto ou sumir
    if (state.currentStep === WIZARD_STEPS.length - 1) {
      btnNext.classList.add('hidden');
    } else {
      btnNext.classList.remove('hidden');
    }

    // Validação específica por passo
    if (state.currentStep === 0) {
      btnNext.disabled = !state.mode;
    } else if (state.currentStep === 1) {
      btnNext.disabled = state.templates.length === 0;
    } else {
      btnNext.disabled = false;
    }
  }
}

/**
 * Inicializa a aplicação
 */
function init() {
  console.log(`🚀 Renderit Builder v${state.VERSION || '0.1.0'} Initialized`);
  
  // Vincular eventos de botões
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnReset = document.getElementById('btn-reset');

  if (btnPrev) btnPrev.addEventListener('click', prevStep);
  if (btnNext) btnNext.addEventListener('click', nextStep);
  if (btnReset) btnReset.addEventListener('click', resetWizard);

  // Renderização inicial
  goToStep(0);
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Exportar para depuração via console se necessário
window.wizard = { state, goToStep, nextStep, prevStep, resetWizard };
