import { injectMarkers, processAnnotations, finalizeAttributes } from '../src/utils/HtmlAnnotator.js';

const tpl = '<img src="%hero.img%" alt="%hero.alt%">';
const marked = injectMarkers(tpl);
console.log('MARKED TEMPLATE:', marked);

// Simulate render
const rendered = marked.replace('%hero.img%', 'a.jpg').replace('%hero.alt%', 'A');
console.log('RENDERED HTML:', rendered);

const annotated = processAnnotations(rendered);
console.log('ANNOTATED (BEFORE FINALIZE):', annotated);

const final = finalizeAttributes(annotated);
console.log('FINAL HTML:', final);
