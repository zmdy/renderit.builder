/**
 * Step 1: Seleção de Modo
 * Permite ao usuário escolher entre Static, Live ou Manager Mode.
 */

import { state, updateNavButtons } from '../wizard.js';

/**
 * Renderiza o conteúdo do passo 1
 * @returns {string} HTML string
 */
export function renderStep1() {
  const modes = [
    {
      id: 'static',
      icon: 'fa-bolt',
      title: 'Static Mode',
      desc: 'Mais rápido. Ideal para sites institucionais e blogs.',
      features: ['Sites Estáticos', 'SEO Nativo', 'Hospedagem Grátis'],
      color: 'text-accent'
    },
    {
      id: 'live',
      icon: 'fa-sync',
      title: 'Live Mode',
      desc: 'Zonas dinâmicas. Ideal para lojas e catálogos.',
      features: ['Updates em Tempo Real', 'Conteúdo Dinâmico', 'Menus Flexíveis'],
      color: 'text-success'
    },
    {
      id: 'manager',
      icon: 'fa-tools',
      title: 'Manager Mode',
      desc: 'Edição remota. Ideal para sites geridos por clientes.',
      features: ['Painel de Edição', 'CMS Externo', 'Requer bridge.php'],
      warning: 'Requer PHP no servidor',
      color: 'text-warn'
    }
  ];

  return `
    <div class="max-w-4xl w-full px-8 fade-in">
      <div class="text-center mb-10">
        <h2 class="text-2xl font-bold text-text mb-2">Qual modo você quer usar?</h2>
        <p class="text-text-3">Escolha a estratégia de build que melhor se adapta ao seu projeto.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${modes.map(mode => `
          <div class="mode-card p-6 rounded-xl flex flex-col gap-4 ${state.mode === mode.id ? 'selected' : ''}" 
               data-mode="${mode.id}">
            
            <div class="w-12 h-12 rounded-lg bg-surface flex items-center justify-center text-xl ${mode.color}">
              <i class="fa-solid ${mode.icon}"></i>
            </div>

            <div>
              <h3 class="font-bold text-text mb-1">${mode.title}</h3>
              <p class="text-[12px] text-text-3 leading-relaxed">${mode.desc}</p>
            </div>

            <ul class="flex flex-col gap-1.5 mt-2">
              ${mode.features.map(f => `
                <li class="flex items-center gap-2 text-[11px] text-text-2">
                  <i class="fa-solid fa-check text-[8px] text-accent opacity-50"></i> ${f}
                </li>
              `).join('')}
            </ul>

            ${mode.warning ? `
              <div class="mt-auto pt-4 border-t border-border/50">
                <span class="px-2 py-0.5 rounded bg-danger/10 text-danger text-[9px] font-bold uppercase tracking-wider">
                  <i class="fa-solid fa-triangle-exclamation mr-1"></i> ${mode.warning}
                </span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Inicializa os eventos do passo 1
 */
export function initStep1() {
  const cards = document.querySelectorAll('.mode-card');
  
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedMode = card.dataset.mode;
      
      // Atualiza estado
      state.mode = selectedMode;
      
      // Atualiza visual dos cards
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      // Habilita navegação
      updateNavButtons();
    });
  });
}
