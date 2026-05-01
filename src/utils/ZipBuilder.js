/**
 * Wrapper em torno do JSZip (via globalThis) para criação do pacote final.
 */
export class ZipBuilder {
  constructor() {
    if (typeof globalThis.JSZip === 'undefined') {
      throw new Error('JSZip global não encontrado. JSZip deve ser carregado via CDN ou injetado em dev.');
    }
    this.zip = new globalThis.JSZip();
  }

  /**
   * Adiciona um arquivo ao ZIP (cria pastas baseadas no path automaticamente).
   * @param {string} path Caminho virtual do arquivo (ex: 'sobre/index.html')
   * @param {string|Blob} content Conteúdo do arquivo
   */
  addFile(path, content) {
    this.zip.file(path, content);
  }

  /**
   * Adiciona um arquivo binário ao ZIP.
   * @param {string} path Caminho virtual do arquivo
   * @param {ArrayBuffer} arrayBuffer Conteúdo binário
   */
  addBinaryFile(path, arrayBuffer) {
    this.zip.file(path, arrayBuffer, { binary: true });
  }

  /**
   * @returns {Promise<Blob>}
   */
  async build() {
    return await this.zip.generateAsync({ type: 'blob' });
  }
}
