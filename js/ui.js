'use strict';
/* ==========================================================
   Componentes visuais reutilizáveis (geram HTML)
   ========================================================== */

const UI = {
  state: {
    ovMetric: 'treinos',
    ovPeriod: 'semanas',
    calOffset: 0,
    trainOffset: 0,
    sleepDay: D.todayKey(),
    mindOffset: 0,
    finMonth: D.monthKey(D.today()),
  },
};

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  arrow: '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
  up: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  down: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  left: '<polyline points="15 18 9 12 15 6"/>',
  right: '<polyline points="9 18 15 12 9 6"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
};

const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 1) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d });
const brl = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, minimumFractionDigits: 0 });
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pillar = id => PILLARS.find(p => p.id === id);

function rangeLabel(mon) {
  const end = D.add(mon, 6);
  const m1 = MONTHS_SHORT[mon.getMonth()].toLowerCase(), m2 = MONTHS_SHORT[end.getMonth()].toLowerCase();
  return mon.getMonth() === end.getMonth()
    ? `${mon.getDate()} – ${end.getDate()} ${m2} ${end.getFullYear()}`
    : `${mon.getDate()} ${m1} – ${end.getDate()} ${m2} ${end.getFullYear()}`;
}
function monthLabel(mk) { const [y, m] = mk.split('-').map(Number); return `${cap(MONTHS[m - 1])} ${y}`; }
function longDate(d) { return `${WEEKDAYS_FULL[(d.getDay() + 6) % 7]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`; }

function pageHeader({ eyebrow, title, desc = '', right = '' }) {
  return `
  <header class="page-head">
    <div>
      <div class="eyebrow">${esc(eyebrow)}</div>
      <h1>${esc(title)}</h1>
      ${desc ? `<p class="desc">${esc(desc)}</p>` : ''}
    </div>
    ${right ? `<div class="head-right">${right}</div>` : ''}
  </header>`;
}

function pillarHeader(id, desc, right = '') {
  const p = pillar(id);
  return pageHeader({ eyebrow: `Pilar ${p.n} · ${p.name}`, title: p.title, desc, right });
}

function trend(cur, prev, { invert = false, suffix = 'vs semana passada' } = {}) {
  if (!prev) return `<div class="trend">${suffix ? 'sem dados para comparar' : ''}</div>`;
  const pct = ((cur - prev) / prev) * 100;
  const up = pct >= 0;
  const good = invert ? !up : up;
  return `<div class="trend"><span class="${good ? 'up' : 'down'}">${icon(up ? 'up' : 'down')}${fmt(Math.abs(pct))}%</span>${esc(suffix)}</div>`;
}

function statCard({ label, value, unit = '', foot = '', dark = false }) {
  return `
  <div class="stat ${dark ? 'dark' : ''}">
    <div class="label">${esc(label)}</div>
    <div>
      <div class="value">${value}${unit ? `<small>${esc(unit)}</small>` : ''}</div>
      ${foot ? `<div style="margin-top:6px">${foot}</div>` : ''}
    </div>
  </div>`;
}

const footText = t => `<div class="trend">${esc(t)}</div>`;

function card({ title = '', sub = '', right = '', body = '', cls = '' }) {
  return `
  <section class="card ${cls}">
    ${title || right ? `<div class="card-head"><div><div class="card-title">${esc(title)}</div>${sub ? `<div class="card-sub">${esc(sub)}</div>` : ''}</div>${right}</div>` : ''}
    ${body}
  </section>`;
}

function niceStep(x) {
  if (x <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const f = x / p;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * p;
}
const fmtTick = v => (v >= 1000 ? `${fmt(v / 1000)}K` : fmt(v));

/* Gráfico de barras com linha de meta. items: {label, value, hl, selected, key} */
function barChart({ items, goal = 0, height = 190, unit = '', action = '', fmtV = v => fmt(v) }) {
  const maxV = Math.max(goal, ...items.map(i => i.value), 0);
  const step = niceStep((maxV || 4) / 4);
  const max = step * 4;
  const ticks = [0, 1, 2, 3, 4].map(i => `<span style="bottom:${i * 25}%">${fmtTick(step * i)}</span>`).join('');
  const bars = items.map(it => {
    const h = clamp((it.value / max) * 100, 0, 100);
    const attrs = action ? `data-action="${action}" data-date="${esc(it.key)}" role="button" tabindex="0" aria-label="${esc(it.label)}: ${esc(fmtV(it.value))}${esc(unit)}"` : '';
    return `<div class="bar-col ${action ? 'clickable' : ''} ${it.selected ? 'selected' : ''}" ${attrs}>
      <div class="bar ${it.hl ? 'hl' : ''} ${it.value ? '' : 'zero'}" style="height:${it.value ? Math.max(h, 3) : 3}%" data-v="${esc(fmtV(it.value))}${esc(unit)}"></div>
    </div>`;
  }).join('');
  const goalLine = goal ? `<div class="goal-line" style="bottom:${(goal / max) * 100}%"><span>meta ${fmt(goal)}${esc(unit)}</span></div>` : '';
  return `
  <div class="chart" style="--h:${height}px">
    <div class="chart-y">${ticks}</div>
    <div class="chart-plot">${goalLine}${bars}</div>
    <div class="chart-x">${items.map(i => `<span class="${i.hl ? 'hl' : ''}">${esc(i.label)}</span>`).join('')}</div>
  </div>`;
}

const progress = (pct, cls = '') => `<div class="progress ${cls}"><span style="width:${clamp(pct, 0, 100)}%"></span></div>`;
const donut = pct => `<div class="donut" style="--p:${clamp(pct, 0, 100)}"><span>${Math.round(pct)}%</span></div>`;

function rating(value, attrs, cls = '') {
  return `<div class="rating ${cls}">${[1, 2, 3, 4, 5].map(v =>
    `<button class="${v <= value ? 'on' : ''}" ${attrs} data-v="${v}" aria-label="Nota ${v}"></button>`).join('')}</div>`;
}

function navGroup({ label, prevAttrs, nextAttrs, nextDisabled = false }) {
  return `<div class="nav-group">
    <button class="icon-btn plain" ${prevAttrs} aria-label="Anterior">${icon('left')}</button>
    <span class="label">${esc(label)}</span>
    <button class="icon-btn plain" ${nextAttrs} ${nextDisabled ? 'disabled' : ''} aria-label="Próximo">${icon('right')}</button>
  </div>`;
}

function removeBtn(attrs, label = 'Remover') {
  return `<button class="icon-btn plain" data-action="remove" ${attrs} aria-label="${esc(label)}" title="${esc(label)}">${icon('x')}</button>`;
}

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2400);
}
