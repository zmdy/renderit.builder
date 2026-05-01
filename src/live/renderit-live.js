/**
 * renderit-live.js — Runtime cliente do Live Mode
 * Hidrata zonas data-renderit-zone com dados JSON frescos via Service Worker.
 * Zero dependências. Meta: < 10KB minificado.
 */
(function () {
  'use strict';

  // ─── Mini-Renderer inline ─────────────────────────────────────────────────

  function resolveVar(path, data) {
    if (!path || !data) return '';
    return path.split('.').reduce((acc, k) => (acc != null ? acc[k] : ''), data) ?? '';
  }

  function renderTemplate(tpl, data) {
    // FOREACH
    tpl = tpl.replace(/%FOREACH\s+(\S+)%([\s\S]*?)%ENDFOREACH%/g, (_, key, body) => {
      const list = resolveVar(key, data);
      if (!Array.isArray(list) || list.length === 0) return '';
      return list.map((item, i) => {
        let out = body;
        out = out.replace(/%INDEX%/g, i);
        out = out.replace(/%INDEX_1%/g, i + 1);
        out = out.replace(/%TOTAL%/g, list.length);
        out = out.replace(/%FIRST%/g, i === 0 ? 'true' : '');
        out = out.replace(/%LAST%/g, i === list.length - 1 ? 'true' : '');
        out = out.replace(/%([a-zA-Z0-9_.]+)%/g, (m, p) => escapeHtml(resolveVar(p, item) ?? resolveVar(p, data) ?? ''));
        return out;
      }).join('');
    });

    // IF / ELSE / ENDIF
    tpl = tpl.replace(/%IF\s+([^%]+)%([\s\S]*?)(?:%ELSE%([\s\S]*?))?%ENDIF%/g, (_, cond, truthy, falsy) => {
      const val = resolveVar(cond.trim(), data);
      return (val && val !== 'false' && val !== '0') ? truthy : (falsy || '');
    });

    // VAR simples
    tpl = tpl.replace(/%([a-zA-Z0-9_.]+)%/g, (_, p) => escapeHtml(String(resolveVar(p, data) ?? '')));

    // Escape literal %%
    return tpl.replace(/%%/g, '%');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── Decodificação Base64 ─────────────────────────────────────────────────

  function decodeBase64(encoded) {
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch (_) {
      return '';
    }
  }

  // ─── Hidratação de uma zona ───────────────────────────────────────────────

  async function hydrateZone(zone) {
    const src = zone.dataset.renderitSrc;
    const encoded = zone.dataset.template;

    if (!src || !encoded) return;

    const template = decodeBase64(encoded);
    if (!template) return;

    let data = {};
    try {
      const res = await fetch(src);
      if (res.ok) data = await res.json();
    } catch (_) {
      // Fallback: mantém loading placeholder invisível, não quebra
      const loader = zone.querySelector('.renderit-loading');
      if (loader) loader.remove();
      return;
    }

    const rendered = renderTemplate(template, data);
    zone.innerHTML = rendered; // dados já sanitizados pelo renderTemplate
  }

  // ─── Registro do Service Worker ───────────────────────────────────────────

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW não disponível — modo degraded, fetch direto
    });
  }

  // ─── Hidratação lazy com IntersectionObserver ─────────────────────────────

  function observeZones(zones) {
    if (!('IntersectionObserver' in window)) {
      zones.forEach(hydrateZone);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          hydrateZone(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px' });

    zones.forEach(z => observer.observe(z));
  }

  // ─── Entry Point ──────────────────────────────────────────────────────────

  function init() {
    registerServiceWorker();
    const zones = Array.from(document.querySelectorAll('[data-renderit-zone]'));
    if (zones.length > 0) observeZones(zones);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
