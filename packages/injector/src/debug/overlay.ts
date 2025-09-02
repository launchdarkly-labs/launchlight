(function(){
  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host{all:initial}
    .panel{position:fixed;bottom:12px;left:12px;background:#111;color:#fff;padding:10px 12px;border-radius:8px;font:12px/1.4 system-ui, sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.4);z-index:2147483647}
    .row{display:flex;gap:8px;align-items:center}
    .key{opacity:.7}
    .val{font-weight:600}
  `;
  const panel = document.createElement('div');
  panel.className = 'panel';
  const state = (window as any).__WEBEXP_RUNTIME__ || {};
  panel.innerHTML = `
    <div class="row"><span class="key">Flag</span><span class="val">${state.flagKey||'-'}</span></div>
    <div class="row"><span class="key">Variation</span><span class="val">${state.variationKey||'-'}</span></div>
    <div class="row"><span class="key">Surface</span><span class="val">${state.surface||'-'}</span></div>
    <div class="row"><span class="key">Ops</span><span class="val">${state.opsCount??'-'}</span></div>
    <div class="row"><span class="key">Apply</span><span class="val">${state.applyMs??'-'} ms</span></div>
  `;
  shadow.appendChild(style);
  shadow.appendChild(panel);
  document.documentElement.appendChild(host);
})();


