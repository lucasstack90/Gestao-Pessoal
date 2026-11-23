'use strict';
/* ==========================================================
   Navegação, renderização e ações do usuário
   ========================================================== */

const ROUTES = ['visao', ...PILLARS.map(p => p.id), 'config'];
const route = () => { const r = location.hash.replace('#', ''); return ROUTES.includes(r) ? r : 'visao'; };
const $main = document.getElementById('main');
const $side = document.getElementById('sidebar');

function sidebarHtml(r) {
  const ok = Calc.status().filter(x => x.ok).length;
  const link = (id, full, short, ic) =>
    `<a href="#${id}" class="${r === id ? 'active' : ''}" ${r === id ? 'aria-current="page"' : ''}>${icon(ic)}<span class="l-full">${esc(full)}</span><span class="l-short">${esc(short)}</span></a>`;
  return `
    <div class="brand">Painel<span>.</span>vida</div>
    <nav class="nav" aria-label="Pilares">
      ${link('visao', 'Visão geral', 'Geral', 'grid')}
      ${PILLARS.map(p => link(p.id, p.name, p.short, p.icon)).join('')}
    </nav>
    <div class="side-card">
      <p>Consistência da semana</p>
      <strong>${ok}/6</strong>
      <span>pilares em dia</span>
      <a class="btn light" href="#mente">Fazer check-in</a>
    </div>
    <nav class="nav nav-bottom" aria-label="Configurações">${link('config', 'Configurações', 'Ajustes', 'sliders')}</nav>`;
}

function render() {
  const r = route();
  const active = document.activeElement;
  const focusKey = active && active.dataset ? active.dataset.k : null;

  $side.innerHTML = sidebarHtml(r);
  const banner = Store.state.sample
    ? `<div class="banner"><span>Você está vendo <b>dados de exemplo</b> para conhecer o painel. Quando quiser, comece com o seu.</span>
        <button class="btn sm" data-action="clearSample">Começar do zero</button></div>`
    : '';
  $main.innerHTML = banner + Views[r]();

  if (focusKey) {
    const el = $main.querySelector(`[data-k="${CSS.escape(focusKey)}"]`);
    if (el) el.focus({ preventScroll: true });
  }
  const p = pillar(r);
  document.title = p ? `${p.short} · Painel da Vida` : r === 'config' ? 'Configurações · Painel da Vida' : 'Painel da Vida';
}

function persist() {
  if (!Store.save()) toast('Não foi possível salvar neste navegador.');
}
function commit() { persist(); render(); }

/* ---------- Cliques ---------- */
const Actions = {
  setUi({ key, value }) { UI.state[key] = value; },
  shift({ key, delta }) { UI.state[key] = Math.min(0, UI.state[key] + Number(delta)); },
  shiftMonth({ delta }) {
    const next = D.addMonths(UI.state.finMonth, Number(delta));
    if (next <= D.monthKey(D.today())) UI.state.finMonth = next;
  },

  toggleTrain({ date }) { const d = Store.day(date); d.trained = !d.trained; },
  toggleHabit({ date }) { const d = Store.day(date); d.habit = !d.habit; },

  selectSleepDay({ date }) { if (D.parse(date) > D.today()) return false; UI.state.sleepDay = date; },
  sleepStep({ delta }) { const d = Store.day(UI.state.sleepDay); d.sleep = clamp((d.sleep || 0) + Number(delta), 0, 14); },
  setEnergy({ date, v }) { const d = Store.day(date); d.energy = d.energy === +v ? 0 : +v; },
  toggleRitual({ id, date }) { const d = Store.day(date); d.rituals = d.rituals || {}; d.rituals[id] = !d.rituals[id]; },

  setRating({ week, p, v }) { const w = Store.week(week); w.ratings = w.ratings || {}; w.ratings[p] = w.ratings[p] === +v ? 0 : +v; },

  togglePages({ date }) {
    const d = Store.day(date), g = Store.state.settings.pagesGoal;
    d.pages = (d.pages || 0) >= g ? 0 : g;
  },
  pagesStep({ delta }) { const d = Store.day(D.todayKey()); d.pages = Math.max(0, (d.pages || 0) + Number(delta)); },
  bookAdd({ id, n }) {
    const b = Store.state.books.find(x => x.id === id);
    if (!b) return false;
    const add = Math.min(Number(n), b.total - b.read);
    b.read += add;
    const d = Store.day(D.todayKey());
    d.pages = (d.pages || 0) + add;
    if (b.read >= b.total) toast(`Livro concluído: ${b.title} 🎉`);
  },

  projStep({ front, id, delta }) {
    const f = Store.state.career.find(x => x.id === front);
    const p = f && f.projects.find(x => x.id === id);
    if (!p) return false;
    p.progress = clamp(p.progress + Number(delta), 0, 100);
    p.updatedAt = Date.now();
    if (p.progress === 100 && Number(delta) > 0) toast(`Projeto concluído: ${p.name} 🎉`);
  },

  removeInvoice({ month }) { delete Store.month(month).invoice; },

  remove({ list, id, front }) {
    const S = Store.state;
    const confirmMsg = { fronts: 'Remover esta frente e todos os projetos dela?', books: 'Remover este livro?', goals: 'Remover esta meta?' }[list];
    if (confirmMsg && !confirm(confirmMsg)) return false;
    if (list === 'categories') { S.finance.categories = S.finance.categories.filter(c => c !== id); return; }
    if (list === 'projects' || list === 'metrics') {
      const f = S.career.find(x => x.id === front);
      if (f) f[list] = f[list].filter(x => x.id !== id);
      return;
    }
    const arr = { records: S.records, rituals: S.rituals, books: S.books, goals: S.finance.goals, fronts: S.career }[list];
    if (!arr) return false;
    const i = arr.findIndex(x => x.id === id);
    if (i >= 0) arr.splice(i, 1);
  },

  exportData() {
    const blob = new Blob([JSON.stringify(Store.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `painel-da-vida-${D.todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Backup exportado');
    return false;
  },
  loadSample() {
    if (!confirm('Substituir seus dados atuais pelos dados de exemplo?')) return false;
    Store.state = sampleState();
    toast('Dados de exemplo carregados');
  },
  clearAll() {
    if (!confirm('Apagar todos os dados do painel? Isso não pode ser desfeito (exporte um backup antes, se quiser).')) return false;
    Store.state = defaultState();
    toast('Painel zerado');
  },
  clearSample() {
    if (!confirm('Apagar os dados de exemplo e começar com um painel vazio?')) return false;
    Store.state = defaultState();
    location.hash = 'config';
    toast('Painel pronto. Comece pelas suas metas.');
  },
};

/* ---------- Formulários ---------- */
const Forms = {
  addRecord({ text }) { Store.state.records.unshift({ id: uid(), text: text.trim() }); },
  addRitual({ name }) { Store.state.rituals.push({ id: uid(), name: name.trim() }); },
  addCategory({ name }) {
    const n = name.trim(), cats = Store.state.finance.categories;
    if (cats.some(c => c.toLowerCase() === n.toLowerCase())) { toast('Essa categoria já existe'); return false; }
    cats.push(n);
  },
  addBook({ title, author, total }) {
    const t = Math.max(1, Math.round(+total || 0));
    Store.state.books.push({ id: uid(), title: title.trim(), author: (author || '').trim(), total: t, read: 0 });
  },
  addGoal({ name, target }) {
    Store.state.finance.goals.push({ id: uid(), name: name.trim(), target: Math.max(1, +target || 0), current: 0 });
  },
  contribute({ amount }, { id }) {
    const g = Store.state.finance.goals.find(x => x.id === id);
    const v = +amount || 0;
    if (!g || !v) return false;
    g.current = Math.max(0, g.current + v);
    toast(v > 0 ? `Aporte de ${brl(v)} registrado` : `Retirada de ${brl(-v)} registrada`);
  },
  addProject({ name }, { front }) {
    const f = Store.state.career.find(x => x.id === front);
    if (!f) return false;
    f.projects.push({ id: uid(), name: name.trim(), progress: 0, updatedAt: Date.now() });
  },
  addMetric({ label }, { front }) {
    const f = Store.state.career.find(x => x.id === front);
    if (!f) return false;
    f.metrics.push({ id: uid(), label: label.trim(), value: 0 });
  },
  addFront({ name, desc }) {
    Store.state.career.push({ id: uid(), name: name.trim(), desc: (desc || '').trim(), metrics: [], projects: [] });
  },
};

/* ---------- Campos (ao confirmar o valor) ---------- */
const Changes = {
  setting(v, { key, type }) {
    const s = Store.state.settings;
    if (type === 'number') {
      const n = +v;
      if (!(n > 0)) return false;
      s[key] = key === 'sleepGoal' ? Math.round(n * 2) / 2 : Math.round(n);
    } else s[key] = v.trim();
  },
  pagesToday(v) { Store.day(D.todayKey()).pages = Math.max(0, Math.round(+v || 0)); },
  income(v, { month }) { Store.month(month).income = Math.max(0, +v || 0); },
  category(v, { month, name }) { const m = Store.month(month); m.categories = m.categories || {}; m.categories[name] = Math.max(0, +v || 0); },
  metric(v, { front, id }) {
    const f = Store.state.career.find(x => x.id === front);
    const mt = f && f.metrics.find(x => x.id === id);
    if (mt) mt.value = +v || 0;
  },
  frontField(v, { front, field }) {
    const f = Store.state.career.find(x => x.id === front);
    if (!f || (field === 'name' && !v.trim())) return false;
    f[field] = v.trim();
  },
  invoice(_, { month }, el) {
    const file = el.files && el.files[0];
    if (!file) return false;
    Store.month(month).invoice = { name: file.name, size: file.size, at: Date.now() };
    toast('Fatura registrada');
  },
  importData(_, __, el) {
    const file = el.files && el.files[0];
    if (!file) return false;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object' || !data.settings) throw new Error('formato');
        if (!confirm('Substituir os dados atuais pelo backup?')) return;
        Store.state = normalize(data);
        Store.state.sample = false;
        commit();
        toast('Backup importado');
      } catch (e) {
        toast('Arquivo inválido: use um backup exportado pelo painel.');
      }
    };
    reader.readAsText(file);
    return false;
  },
};

/* ---------- Texto livre (salva enquanto digita, sem redesenhar) ---------- */
const Inputs = {
  mind(v, { week, field }) { Store.week(week)[field] = v; },
};

/* ---------- Ligação dos eventos ---------- */
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { e.preventDefault(); location.hash = nav.dataset.nav; return; }
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = Actions[el.dataset.action];
  if (!fn) return;
  e.preventDefault();
  if (fn(el.dataset, el) === false) return;
  commit();
});

document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-action]')) {
    e.preventDefault();
    e.target.click();
  }
});

document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-submit]');
  if (!form) return;
  e.preventDefault();
  const fn = Forms[form.dataset.submit];
  if (!fn) return;
  const data = Object.fromEntries(new FormData(form));
  if (fn(data, form.dataset) === false) return;
  commit();
});

document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  const fn = Changes[el.dataset.change];
  if (!fn) return;
  if (fn(el.value, el.dataset, el) === false) { render(); return; }
  commit();
});

document.addEventListener('input', e => {
  const el = e.target.closest('[data-input]');
  if (!el) return;
  const fn = Inputs[el.dataset.input];
  if (fn) { fn(el.value, el.dataset, el); persist(); }
});

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

Store.load();
render();
