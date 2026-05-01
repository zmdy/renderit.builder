/**
 * JsonEditor.js
 * Componente para renderização e edição visual de objetos JSON.
 */

export class JsonEditor {
  constructor(options = {}) {
    this.onChange = options.onChange || (() => {});
    this.container = null;
    this.data = null;
  }

  /**
   * Renderiza o editor em um container
   */
  render(data, container) {
    this.data = data;
    this.container = container;
    this.container.innerHTML = this.generateHTML(data);
    this.bindEvents();
  }

  /**
   * Gera o HTML recursivo para o objeto
   */
  generateHTML(obj, path = '') {
    let html = '';

    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      const label = key.charAt(0).toUpperCase() + key.slice(1);

      if (key === 'design') {
        html += this.renderDesignButton();
        continue;
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        html += `
          <div class="json-section mb-6">
            <h4 class="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-3 border-b border-border/30 pb-1">${label}</h4>
            <div class="pl-4 border-l border-border/20 flex flex-col gap-4">
              ${this.generateHTML(value, fullPath)}
            </div>
          </div>
        `;
      } else if (Array.isArray(value)) {
        html += this.renderArray(label, fullPath, value);
      } else {
        html += this.renderField(label, fullPath, value);
      }
    }

    return html;
  }

  /**
   * Renderiza o botão do Design System
   */
  renderDesignButton() {
    return `
      <div class="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center justify-between mb-6 group hover:border-accent transition-all">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-panel flex items-center justify-center text-accent">
            <i class="fa-solid fa-palette"></i>
          </div>
          <div>
            <h4 class="text-sm font-bold text-text">Design System</h4>
            <p class="text-[10px] text-text-3">Cores, fontes e estilos globais</p>
          </div>
        </div>
        <button id="btn-open-design" class="px-4 py-2 rounded-lg bg-accent text-white text-[10px] font-bold hover:bg-blue-600 transition-all">
          Abrir Editor
        </button>
      </div>
    `;
  }

  /**
   * Renderiza um campo escalar (input ou textarea)
   */
  renderField(label, path, value) {
    const isLong = typeof value === 'string' && value.length > 50;
    
    return `
      <div class="flex flex-col gap-1.5 mb-2">
        <label class="text-[11px] font-bold text-text-2" for="edit-${path}">${label}</label>
        ${isLong 
          ? `<textarea id="edit-${path}" data-path="${path}" class="editor-field w-full bg-panel border border-border rounded-lg px-3 py-2 text-xs text-text focus:border-accent outline-none min-h-[80px] resize-none" placeholder="Digite ${label.toLowerCase()}...">${value}</textarea>`
          : `<input id="edit-${path}" data-path="${path}" type="text" value="${value}" class="editor-field w-full bg-panel border border-border rounded-lg px-3 py-2 text-xs text-text focus:border-accent outline-none" placeholder="Digite ${label.toLowerCase()}...">`
        }
      </div>
    `;
  }

  /**
   * Renderiza um bloco de array manipulável
   */
  renderArray(label, path, items) {
    return `
      <div class="mb-6 accordion-item border border-border rounded-xl overflow-hidden bg-panel/10">
        <div class="px-4 py-3 bg-surface border-b border-border flex items-center justify-between">
          <span class="text-[11px] font-bold text-text-2 uppercase tracking-widest">${label}</span>
          <button class="btn-add-item px-2 py-1 rounded bg-accent/10 text-accent text-[10px] font-bold hover:bg-accent hover:text-white transition-all" data-path="${path}">
            <i class="fa-solid fa-plus mr-1"></i> Adicionar
          </button>
        </div>
        <div class="flex flex-col divide-y divide-border/30">
          ${items.map((item, index) => `
            <div class="p-4 flex flex-col gap-4 relative group">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[9px] font-bold text-text-3 uppercase">Item #${index + 1}</span>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="btn-move-item text-[10px] text-text-3 hover:text-accent" data-path="${path}" data-index="${index}" data-dir="up"><i class="fa-solid fa-chevron-up"></i></button>
                  <button class="btn-move-item text-[10px] text-text-3 hover:text-accent" data-path="${path}" data-index="${index}" data-dir="down"><i class="fa-solid fa-chevron-down"></i></button>
                  <button class="btn-remove-item text-[10px] text-text-3 hover:text-danger" data-path="${path}" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
              </div>
              ${this.generateHTML(item, `${path}.${index}`)}
            </div>
          `).join('')}
          ${items.length === 0 ? '<div class="p-6 text-center text-[10px] text-text-3 italic">Nenhum item na lista</div>' : ''}
        </div>
      </div>
    `;
  }

  /**
   * Adiciona um novo item ao array
   */
  addItem(path) {
    const parts = path.split('.');
    let current = this.data;
    for (const part of parts) current = current[part];

    if (Array.isArray(current)) {
      const template = current.length > 0 ? JSON.parse(JSON.stringify(current[0])) : {};
      const clearValues = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) clearValues(obj[key]);
          else obj[key] = "";
        }
      };
      if (current.length > 0) clearValues(template);
      current.push(template);
      this.render(this.data, this.container);
      this.onChange(this.data);
    }
  }

  /**
   * Remove um item do array
   */
  removeItem(path, index) {
    if (!confirm('Excluir este item?')) return;
    const parts = path.split('.');
    let current = this.data;
    for (const part of parts) current = current[part];

    if (Array.isArray(current)) {
      current.splice(index, 1);
      this.render(this.data, this.container);
      this.onChange(this.data);
    }
  }

  /**
   * Move um item no array
   */
  moveItem(path, index, direction) {
    const parts = path.split('.');
    let current = this.data;
    for (const part of parts) current = current[part];

    if (Array.isArray(current)) {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return;
      [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
      this.render(this.data, this.container);
      this.onChange(this.data);
    }
  }

  /**
   * Vincula eventos de interface
   */
  bindEvents() {
    this.container.querySelectorAll('.editor-field').forEach(field => {
      field.addEventListener('input', (e) => {
        this.updateData(e.target.dataset.path, e.target.value);
        this.onChange(this.data);
      });
    });

    this.container.querySelectorAll('.btn-add-item').forEach(btn => btn.onclick = () => this.addItem(btn.dataset.path));
    this.container.querySelectorAll('.btn-remove-item').forEach(btn => btn.onclick = () => this.removeItem(btn.dataset.path, parseInt(btn.dataset.index)));
    this.container.querySelectorAll('.btn-move-item').forEach(btn => btn.onclick = () => this.moveItem(btn.dataset.path, parseInt(btn.dataset.index), btn.dataset.dir));
    
    const btnDesign = this.container.querySelector('#btn-open-design');
    if (btnDesign) btnDesign.onclick = () => this.openDesignEditor();
  }

  /**
   * Abre o modal de edição do Design System
   */
  openDesignEditor() {
    const categories = [
      { id: 'cores', label: 'Cores', icon: 'fa-palette' },
      { id: 'tipografia', label: 'Tipografia', icon: 'fa-font' },
      { id: 'espacamento', label: 'Espaçamento', icon: 'fa-arrows-left-right' },
      { id: 'componentes', label: 'Componentes', icon: 'fa-cubes' },
      { id: 'diretrizes', label: 'Diretrizes', icon: 'fa-book' }
    ];

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 fade-in';
    modal.innerHTML = this.renderModalSkeleton(categories);
    document.body.appendChild(modal);

    this.bindModalEvents(modal, categories);
  }

  renderModalSkeleton(categories) {
    return `
      <div class="bg-surface border border-border w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden scale-in">
        <div class="px-6 py-4 border-b border-border flex items-center justify-between bg-panel">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-wand-magic-sparkles text-accent"></i>
            <h3 class="text-sm font-bold text-text uppercase tracking-widest">Configuração de Design</h3>
          </div>
          <button id="btn-close-modal" class="p-2 text-text-3 hover:text-text transition-colors"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="flex-1 flex overflow-hidden">
          <div class="w-56 border-r border-border bg-panel/30 p-4 flex flex-col gap-2">
            ${categories.map((cat, idx) => `
              <button class="design-tab px-4 py-3 rounded-xl text-left text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${idx === 0 ? 'bg-accent text-white shadow-lg' : 'text-text-3 hover:bg-panel'}" data-cat="${cat.id}">
                <i class="fa-solid ${cat.icon} w-4"></i>${cat.label}
              </button>
            `).join('')}
          </div>
          <div id="design-tab-content" class="flex-1 p-10 overflow-y-auto no-scrollbar bg-surface/50">
            ${this.renderDesignCategory(categories[0].id)}
          </div>
        </div>
        <div class="px-6 py-4 border-t border-border flex justify-end gap-3 bg-panel">
          <button id="btn-save-design" class="px-8 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-accent/30">Aplicar Alterações</button>
        </div>
      </div>
    `;
  }

  bindModalEvents(modal, categories) {
    modal.querySelector('#btn-close-modal').onclick = () => modal.remove();
    modal.querySelector('#btn-save-design').onclick = () => { this.onChange(this.data); modal.remove(); };

    const tabs = modal.querySelectorAll('.design-tab');
    const content = modal.querySelector('#design-tab-content');

    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => { t.classList.remove('bg-accent', 'text-white', 'shadow-lg'); t.classList.add('text-text-3', 'hover:bg-panel'); });
        tab.classList.add('bg-accent', 'text-white', 'shadow-lg');
        tab.classList.remove('text-text-3', 'hover:bg-panel');
        content.innerHTML = this.renderDesignCategory(tab.dataset.cat);
        this.bindDesignEvents(content, tab.dataset.cat);
      };
    });

    this.bindDesignEvents(content, categories[0].id);
  }

  renderDesignCategory(catId) {
    const mapping = {
      cores: ['colors', 'palette', 'branding.colors'],
      tipografia: ['typography', 'fonts', 'sizes'],
      espacamento: ['spacing', 'grid', 'layout', 'spacings'],
      componentes: ['components', 'ui', 'elements'],
      diretrizes: ['guidelines', 'overview', 'dos', 'donts', 'brand']
    };
    const keys = mapping[catId];
    let html = `<div class="fade-in"><h4 class="text-xs font-bold text-text-2 mb-8 border-b border-border/30 pb-3 uppercase tracking-widest">${catId}</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-8">`;
    let foundAny = false;
    keys.forEach(key => {
      const data = this.getNestedValue(this.data.design, key);
      if (data) { foundAny = true; html += this.renderDesignFields(data, key); }
    });
    if (!foundAny) {
      html += `<div class="col-span-2 p-12 text-center border-2 border-dashed border-border rounded-2xl"><i class="fa-solid fa-magnifying-glass text-2xl text-text-3/20 mb-4"></i><p class="text-text-3 text-xs italic">Nenhum token de "${catId}" encontrado.</p></div>`;
    }
    return html + `</div></div>`;
  }

  renderDesignFields(data, prefix) {
    const GOOGLE_FONTS = ['Inter', 'Roboto', 'Montserrat', 'Open Sans', 'Playfair Display', 'Lora', 'Oswald', 'Raleway', 'Poppins', 'Ubuntu'];
    return Object.entries(data).map(([key, value]) => {
      const fullKey = `${prefix}.${key}`, label = key.charAt(0).toUpperCase() + key.slice(1);
      const isColor = key.toLowerCase().includes('color') || (typeof value === 'string' && value.startsWith('#'));
      const isFont = key.toLowerCase().includes('font') || key.toLowerCase().includes('family');
      const isLong = ['overview', 'dos', 'donts', 'layout', 'guidelines', 'description'].includes(key.toLowerCase()) || (typeof value === 'string' && value.length > 50);
      let inputHtml = '';
      if (isColor) {
        inputHtml = `<div class="flex gap-2 p-1 bg-panel border border-border rounded-xl"><div class="w-10 h-10 rounded-lg border border-border shadow-inner" style="background-color: ${value}"></div><input type="color" value="${value}" class="design-field opacity-0 absolute w-0 h-0" data-path="${fullKey}"><input type="text" value="${value}" class="design-field-text flex-1 bg-transparent px-3 text-xs text-text outline-none" data-path="${fullKey}"></div>`;
      } else if (isFont) {
        inputHtml = `<select class="design-field-text w-full bg-panel border border-border rounded-xl px-4 py-2.5 text-xs text-text outline-none focus:border-accent appearance-none" data-path="${fullKey}"><option value="">Selecione...</option>${GOOGLE_FONTS.map(font => `<option value="${font}" ${value === font ? 'selected' : ''}>${font}</option>`).join('')}${value && !GOOGLE_FONTS.includes(value) ? `<option value="${value}" selected>${value}</option>` : ''}</select>`;
      } else if (isLong) {
        inputHtml = `<textarea class="design-field-text w-full bg-panel border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-accent min-h-[100px] resize-none" data-path="${fullKey}">${value}</textarea>`;
      } else {
        inputHtml = `<input type="text" value="${value}" class="design-field-text w-full bg-panel border border-border rounded-xl px-4 py-2.5 text-xs text-text outline-none focus:border-accent" data-path="${fullKey}">`;
      }
      return `<div class="flex flex-col gap-2 ${isLong ? 'col-span-2' : ''}"><label class="text-[11px] font-bold text-text-3">${label}</label>${inputHtml}</div>`;
    }).join('');
  }

  getNestedValue(obj, path) { return path.split('.').reduce((acc, part) => acc && acc[part], obj); }

  bindDesignEvents(container, catId) {
    const update = (path, val) => {
      this.setNestedValue(this.data.design, path, val);
      const swatch = container.querySelector(`[data-path="${path}"].design-field`)?.previousElementSibling;
      if (swatch) swatch.style.backgroundColor = val;
      container.querySelectorAll(`[data-path="${path}"]`).forEach(input => { if (input.value !== val) input.value = val; });
    };
    container.querySelectorAll('.design-field, .design-field-text').forEach(input => input.oninput = (e) => update(e.target.dataset.path, e.target.value));
    container.querySelectorAll('.design-field').forEach(input => { const swatch = input.previousElementSibling; if (swatch) swatch.onclick = () => input.click(); });
  }

  setNestedValue(obj, path, value) {
    const parts = path.split('.'); let current = obj;
    for (let i = 0; i < parts.length - 1; i++) { if (!current[parts[i]]) current[parts[i]] = {}; current = current[parts[i]]; }
    current[parts[parts.length - 1]] = value;
  }

  updateData(path, value) {
    const parts = path.split('.'); let current = this.data;
    for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
    current[parts[parts.length - 1]] = value;
  }
}
