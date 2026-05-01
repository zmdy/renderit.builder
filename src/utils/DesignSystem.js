/**
 * Produz a fundação em branco de um design system de acordo com o Schema estipulado
 * @returns {Object}
 */
export function buildDesignSample() {
  const typoBase = { fontFamily: "", letterSpacing: "0em" };
  return {
    meta: { version: "1.0.0", name: "", description: "" },
    colors: { primary: "#000", secondary: "#666", tertiary: "#0066CC", neutral: "#F5F5F5", surface: "#FFF", "on-surface": "#1A1A1A", error: "#B3261E", success: "#386A20", warning: "#7D5700", info: "#00639B" },
    typography: {
      "headline-display": { ...typoBase, fontSize: "64px", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em" },
      "headline-lg":      { ...typoBase, fontSize: "48px", fontWeight: 600, lineHeight: 1.1,  letterSpacing: "-0.02em" },
      "headline-md":      { ...typoBase, fontSize: "36px", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em" },
      "headline-sm":      { ...typoBase, fontSize: "28px", fontWeight: 600, lineHeight: 1.2 },
      "body-lg":          { ...typoBase, fontSize: "18px", fontWeight: 400, lineHeight: 1.7 },
      "body-md":          { ...typoBase, fontSize: "16px", fontWeight: 400, lineHeight: 1.6 },
      "body-sm":          { ...typoBase, fontSize: "14px", fontWeight: 400, lineHeight: 1.5 },
      "label-lg":         { ...typoBase, fontSize: "14px", fontWeight: 500, lineHeight: 1.4, letterSpacing: "0.05em" },
      "label-md":         { ...typoBase, fontSize: "12px", fontWeight: 500, lineHeight: 1.3, letterSpacing: "0.08em" },
      "label-sm":         { ...typoBase, fontSize: "11px", fontWeight: 500, lineHeight: 1.2, letterSpacing: "0.1em" },
      "caption":          { ...typoBase, fontSize: "12px", fontWeight: 400, lineHeight: 1.4, letterSpacing: "0.02em" }
    },
    spacing: { base: "8px", xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px", "3xl": "64px", "4xl": "96px", section: "120px", gutter: "24px", margin: "32px", "container-max": "1200px" },
    rounded: { none: "0px", sm: "4px", md: "8px", lg: "12px", xl: "16px", "2xl": "24px", full: "9999px" },
    elevation: { none: "none", sm: "0 1px 2px rgba(0,0,0,0.05)", md: "0 4px 6px rgba(0,0,0,0.07)", lg: "0 10px 15px rgba(0,0,0,0.10)", xl: "0 20px 25px rgba(0,0,0,0.12)" },
    components: {}, overview: "", layout: "", shapes: "", dos: [], donts: [],
    fonts: { primary: "", secondary: "", sources: [] }
  };
}

/**
 * Valida os nós estruturais do design.
 * @param {Object} design
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateDesign(design) {
  const result = { valid: true, errors: [] };
  
  if (!design || typeof design !== 'object') {
    result.errors.push('Objeto design ausente ou inválido');
    result.valid = false;
    return result;
  }

  const requiredGroups = ['meta', 'colors', 'typography', 'spacing', 'rounded', 'elevation', 'fonts'];
  for (const group of requiredGroups) {
    if (!design[group]) {
      result.errors.push(`Grupo obrigatório ausente: ${group}`);
    }
  }

  if (design.colors && !design.colors.primary) {
    result.errors.push('Cor primária (colors.primary) não definida');
  }

  if (design.typography && !design.typography['body-md']) {
    result.errors.push('Tipografia base (typography.body-md) não definida');
  }

  result.valid = result.errors.length === 0;
  return result;
}
