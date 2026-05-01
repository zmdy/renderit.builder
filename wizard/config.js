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
    return `https://raw.githubusercontent.com/${this.org}/${this.repo}/${this.branch}/addons`
  }
}

export const EDITOR_PHP_URL =
  'https://raw.githubusercontent.com/zmdy/renderit.editor/main/renderit_editor.php'

export const WIZARD_STEPS = ['mode', 'template', 'sample', 'data', 'build']

export const STEP_LABELS = {
  mode:     'Modo',
  template: 'Template',
  sample:   'JSON Sample',
  data:     'Dados',
  build:    'Build'
}
