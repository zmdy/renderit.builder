/**
 * renderit.builder — Wizard Configuration
 * Configurações globais para o motor de interface.
 */

export const VERSION = '0.1.0'

export const THEMES_REPO = {
  org: 'zmdy',
  repo: 'renderit.themes',
  branch: 'main',
  get addonsBaseUrl() {
    return `https://raw.githubusercontent.com/${this.org}/${this.repo}/refs/heads/${this.branch}/addons`
  }
}

export const EDITOR_REPO = {
  org: 'zmdy',
  repo: 'renderit.editor',
  branch: 'main',
  get styleUrl() {
    return `https://cdn.jsdelivr.net/gh/${this.org}/${this.repo}@${this.branch}/dist/renderit-core-style.min.css`
  },
  get themeEngineUrl() {
    return `https://esm.sh/gh/${this.org}/${this.repo}@${this.branch}/app/core/theme.js`
  }
}

export const EDITOR_PHP_URL =
  `https://raw.githubusercontent.com/${EDITOR_REPO.org}/${EDITOR_REPO.repo}/refs/heads/${EDITOR_REPO.branch}/renderit_editor.php`

export const WIZARD_STEPS = ['mode', 'template', 'sample', 'data', 'build']

export const STEP_LABELS = {
  mode: 'Modo',
  template: 'Template',
  sample: 'JSON Sample',
  data: 'Dados',
  build: 'Build'
}
