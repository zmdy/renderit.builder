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
    let val = path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), data);
    
    if (val === undefined) {
      for (const key in data) {
        if (data[key] && typeof data[key] === 'object') {
          let deepVal = path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), data[key]);
          if (deepVal !== undefined) return deepVal;
        }
      }
    }
    return val ?? '';
  }

  function renderIf(tpl, data) {
    return tpl.replace(/%IF\s+([^%]+)%([\s\S]*?)(?:%ELSE%([\s\S]*?))?%ENDIF%/g, (_, cond, truthy, falsy) => {
      const val = resolveVar(cond.trim(), data);
      return (val && val !== 'false' && val !== '0') ? truthy : (falsy || '');
    });
  }

  function renderForeach(tpl, data) {
    let result = '';
    let pos = 0;
    while (true) {
      let startIdx = tpl.indexOf('%FOREACH ', pos);
      if (startIdx === -1) {
        result += tpl.slice(pos);
        break;
      }
      
      let tagEnd = tpl.indexOf('%', startIdx + 9);
      if (tagEnd === -1) break;
      
      let key = tpl.slice(startIdx + 9, tagEnd).trim();
      let contentStart = tagEnd + 1;
      
      let depth = 1;
      let innerEnd = -1;
      let searchPos = contentStart;
      
      while (searchPos < tpl.length) {
        let nextOpen = tpl.indexOf('%FOREACH ', searchPos);
        let nextClose = tpl.indexOf('%ENDFOREACH%', searchPos);
        
        if (nextClose === -1) break;
        
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          searchPos = nextOpen + 9;
        } else {
          depth--;
          if (depth === 0) {
            innerEnd = nextClose;
            break;
          }
          searchPos = nextClose + 12;
        }
      }
      
      if (innerEnd === -1) {
        result += tpl.slice(pos);
        break;
      }
      
      let body = tpl.slice(contentStart, innerEnd);
      let list = resolveVar(key, data);
      
      result += tpl.slice(pos, startIdx);
      
      if (Array.isArray(list) && list.length > 0) {
        result += list.map((item, i) => {
          let out = body
            .replace(/%INDEX%/g, i)
            .replace(/%INDEX_1%/g, i + 1)
            .replace(/%TOTAL%/g, list.length)
            .replace(/%FIRST%/g, i === 0 ? 'true' : '')
            .replace(/%LAST%/g, i === list.length - 1 ? 'true' : '');
            
          let scopedData = typeof item === 'object' && item !== null ? Object.assign({}, data, item) : data;
          out = renderForeach(out, scopedData);
          out = renderIf(out, scopedData);
          
          return out.replace(/%([a-zA-Z0-9_.]+)%/g, (m, p) => {
            if (p === 'ENDIF' || p === 'ELSE' || p === 'ENDFOREACH') return m;
            return escapeHtml(String(resolveVar(p, item) ?? resolveVar(p, data) ?? ''));
          });
        }).join('');
      }
      
      pos = innerEnd + 12;
    }
    return result;
  }

  function renderTemplate(tpl, data) {
    tpl = renderForeach(tpl, data);
    tpl = renderIf(tpl, data);
    tpl = tpl.replace(/%([a-zA-Z0-9_.]+)%/g, (m, p) => {
      if (p === 'ENDIF' || p === 'ELSE' || p === 'ENDFOREACH') return m;
      return escapeHtml(String(resolveVar(p, data) ?? ''));
    });
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

    const scripts = zone.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  // ─── Registro do Service Worker ───────────────────────────────────────────

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js').catch(() => {});
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
