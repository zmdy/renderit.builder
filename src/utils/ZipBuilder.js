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
   * @returns {Promise<Blob>}
   */
  async generateBlob() {
    return await this.zip.generateAsync({ type: 'blob' });
  }

  /**
   * @returns {Promise<string>}
   */
  async generateBase64() {
    return await this.zip.generateAsync({ type: 'base64' });
  }
}
