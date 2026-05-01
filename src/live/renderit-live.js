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

  function renderForeach(tpl, data) {
    return tpl.replace(/%FOREACH\s+(\S+)%([\s\S]*?)%ENDFOREACH%/g, (_, key, body) => {
      const list = resolveVar(key, data);
      if (!Array.isArray(list) || list.length === 0) return '';
      return list.map((item, i) => {
        let out = body
          .replace(/%INDEX%/g, i)
          .replace(/%INDEX_1%/g, i + 1)
          .replace(/%TOTAL%/g, list.length)
          .replace(/%FIRST%/g, i === 0 ? 'true' : '')
          .replace(/%LAST%/g, i === list.length - 1 ? 'true' : '');
        return out.replace(/%([a-zA-Z0-9_.]+)%/g, (m, p) =>
          escapeHtml(String(resolveVar(p, item) ?? resolveVar(p, data) ?? '')));
      }).join('');
    });
  }

  function renderTemplate(tpl, data) {
    tpl = renderForeach(tpl, data);
    tpl = tpl.replace(/%IF\s+([^%]+)%([\s\S]*?)(?:%ELSE%([\s\S]*?))?%ENDIF%/g, (_, cond, truthy, falsy) => {
      const val = resolveVar(cond.trim(), data);
      return (val && val !== 'false' && val !== '0') ? truthy : (falsy || '');
    });
    tpl = tpl.replace(/%([a-zA-Z0-9_.]+)%/g, (_, p) => escapeHtml(String(resolveVar(p, data) ?? '')));
    return tpl.replace(/%%/g, '%');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ─── Decodificação Base64 ─────────────────────────────────────────────────

  function decodeBase64(encoded) {
    try { return decodeURIComponent(escape(atob(encoded))); }
    catch (_) { return ''; }
  }

  // ─── Hidratação de uma zona ───────────────────────────────────────────────

  async function hydrateZone(zone) {
    const src = zone.dataset.renderitSrc;
    const encoded = zone.dataset.renderitTemplate; // data-renderit-template

    if (!src || !encoded) return;

    const template = decodeBase64(encoded);
    if (!template) return;

    let data = {};
    try {
      const res = await fetch(src);
      if (res.ok) data = await res.json();
    } catch (_) {
      const loader = zone.querySelector('.renderit-loading');
      if (loader) loader.remove();
      return;
    }

    zone.innerHTML = renderTemplate(template, data);
  }

  // ─── Registro do Service Worker ───────────────────────────────────────────

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // ─── Hidratação lazy (apenas para data-renderit-lazy) ─────────────────────

  function observeLazyZones(zones) {
    if (!('IntersectionObserver' in window)) {
      return Promise.all(zones.map(hydrateZone));
    }
    return new Promise(resolve => {
      let pending = zones.length;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          hydrateZone(entry.target).finally(() => { if (--pending === 0) resolve(); });
        });
      }, { rootMargin: '200px' });
      zones.forEach(z => observer.observe(z));
    });
  }

  // ─── Entry Point ──────────────────────────────────────────────────────────

  function init() {
    registerServiceWorker();
    const all = Array.from(document.querySelectorAll('[data-renderit-zone]'));
    const lazy = all.filter(z => z.hasAttribute('data-renderit-lazy'));
    const eager = all.filter(z => !z.hasAttribute('data-renderit-lazy'));

    if (eager.length > 0) Promise.all(eager.map(hydrateZone)); // paralelo imediato
    if (lazy.length > 0) observeLazyZones(lazy);               // só no viewport
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
