/**
 * Renderit Builder Wizard — Main Controller
 * Responsável pelo estado global e navegação entre passos.
 */
import { WIZARD_STEPS } from './config.js';

class WizardController {
  constructor() {
    this.state = {
      currentStep: 1,
      mode: null,
      templates: [],
      data: null,
      detectedAddons: []
    };
    
    this.init();
  }

  init() {
    console.log('🚀 Renderit Builder Wizard Initialized');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Escuta botões de navegação no app-footer
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnReset = document.getElementById('btn-reset');

    if (btnNext) btnNext.addEventListener('click', () => this.nextStep());
    if (btnPrev) btnPrev.addEventListener('click', () => this.prevStep());
    if (btnReset) btnReset.addEventListener('click', () => this.reset());
  }

  nextStep() {
    if (this.state.currentStep < 5) {
      this.state.currentStep++;
      this.updateUI();
    }
  }

  prevStep() {
    if (this.state.currentStep > 1) {
      this.state.currentStep--;
      this.updateUI();
    }
  }

  reset() {
    if (confirm('Tem certeza que deseja recomeçar? Todos os dados não salvos serão perdidos.')) {
      window.location.reload();
    }
  }

  updateUI() {
    console.log(`Switching to Step ${this.state.currentStep}`);
    // A implementação da troca de steps virá na Sprint 2.1
  }
}

// Inicializa o Wizard quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.wizard = new WizardController();
});
