/**
 * Configurações globais do Builder Wizard
 */
export const THEMES_REPO = {
  org: 'zmdy',
  repo: 'renderit.themes',
  branch: 'main',
  get baseUrl() {
    return `https://raw.githubusercontent.com/${this.org}/${this.repo}/${this.branch}`;
  }
};

export const WIZARD_STEPS = [
  { id: 1, name: 'Modo' },
  { id: 2, name: 'Template' },
  { id: 3, name: 'Sample' },
  { id: 4, name: 'Dados' },
  { id: 5, name: 'Build' }
];
