'use strict';
/* ==========================================================
   Dados: datas, estado salvo no navegador e cálculos.
   Tudo é guardado por data, para que sequências, médias e
   gráficos sejam calculados a partir do histórico.
   ========================================================== */

const STORAGE_KEY = 'painel-vida:v1';

const D = {
  key(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
  parse(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); },
  today() { const t = new Date(); t.setHours(0, 0, 0, 0); return t; },
  todayKey() { return D.key(D.today()); },
  add(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; },
  monday(d) { const r = new Date(d); r.setHours(0, 0, 0, 0); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; },
  monthKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; },
  addMonths(mk, n) { const [y, m] = mk.split('-').map(Number); return D.monthKey(new Date(y, m - 1 + n, 1)); },
  daysBetween(a, b) { return Math.round((b - a) / 864e5); },
};

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const WEEKDAYS_FULL = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const PILLARS = [
  { id: 'saude',    n: '01', name: 'Saúde & corpo',   short: 'Saúde',    icon: 'heart',     title: 'Treino e movimento' },
  { id: 'sono',     n: '02', name: 'Sono & descanso', short: 'Sono',     icon: 'moon',      title: 'Quanto você tá descansando' },
  { id: 'mente',    n: '03', name: 'Mente',           short: 'Mente',    icon: 'smile',     title: 'Check-in e balanço da semana' },
  { id: 'estudo',   n: '04', name: 'Estudo',          short: 'Estudo',   icon: 'book',      title: 'Leitura e aprendizados' },
  { id: 'financas', n: '05', name: 'Finanças',        short: 'Finanças', icon: 'wallet',    title: 'Fatura, gastos e metas de longo prazo' },
  { id: 'carreira', n: '06', name: 'Carreira',        short: 'Carreira', icon: 'briefcase', title: 'Plano de ação e evolução' },
];

function uid() { return Math.random().toString(36).slice(2, 10); }

function defaultState() {
  return {
    version: 1,
    sample: false,
    settings: { name: '', trainGoal: 5, sleepGoal: 8, pagesGoal: 15, habitName: 'Caminhada de 20 min' },
    days: {},    // 'AAAA-MM-DD' -> { trained, sleep, energy, pages, habit, rituals: {id: true} }
    weeks: {},   // segunda-feira 'AAAA-MM-DD' -> { feeling, good, insights, q1, q2, q3, ratings: {pilar: 1-5} }
    rituals: [
      { id: uid(), name: 'Sem tela 30 min antes de dormir' },
      { id: uid(), name: 'Diário antes de dormir' },
      { id: uid(), name: 'Sem cafeína depois das 17h' },
    ],
    records: [],
    books: [],
    finance: {
      categories: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Assinaturas e cursos'],
      months: {}, // 'AAAA-MM' -> { income, categories: {nome: valor}, invoice: {name, at} }
      goals: [],
    },
    career: [
      { id: uid(), name: 'Trabalho', desc: 'Plano de ação da frente principal', metrics: [], projects: [] },
    ],
  };
}

/* Gerador previsível, para os dados de exemplo ficarem sempre iguais */
function rng(seed) {
  let s = seed % 2147483647;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function sampleState() {
  const s = defaultState();
  s.sample = true;
  const r = rng(20261123);
  const today = D.today();
  const rit = s.rituals.map(x => x.id);

  for (let i = 69; i >= 1; i--) {
    const k = D.key(D.add(today, -i));
    const day = {
      trained: r() < 0.66,
      sleep: Math.round((6 + r() * 2.6) * 2) / 2,
      energy: 2 + Math.floor(r() * 4),
      pages: r() < 0.8 ? 6 + Math.floor(r() * 20) : 0,
      habit: i < 23 || r() < 0.6,
      rituals: {},
    };
    if (i <= 3) day.pages = 15 + Math.floor(r() * 10);
    rit.forEach(id => { if (r() < 0.6) day.rituals[id] = true; });
    s.days[k] = day;
  }
  s.days[D.key(today)] = { trained: true, sleep: 7, energy: 3, pages: 12, habit: false, rituals: { [rit[0]]: true, [rit[2]]: true } };

  const mon = D.monday(today);
  const reflections = [
    ['Semana leve, consegui manter os treinos.', 'Acordar sem pressa ajudou muito.', 'Dormir antes das 23h'],
    ['Semana puxada no trabalho, pouco descanso.', 'Bloquear a agenda funcionou.', 'Dizer não para reunião sem pauta'],
    ['Me senti mais organizado com o painel.', 'Ler antes de dormir em vez do celular.', 'Planejar o domingo'],
    ['Cansado, mas com sensação de progresso.', 'Treinar de manhã.', 'Menos café à tarde'],
    ['Boa semana no geral.', 'Revisar os gastos semanalmente.', 'Manter a leitura no fim de semana'],
  ];
  for (let w = 1; w <= 5; w++) {
    const [feeling, q1, q2] = reflections[w - 1];
    s.weeks[D.key(D.add(mon, -7 * w))] = {
      feeling, good: '', insights: '', q1, q2, q3: '',
      ratings: { saude: 2 + Math.floor(r() * 4), sono: 2 + Math.floor(r() * 3), estudo: 2 + Math.floor(r() * 4), financas: 2 + Math.floor(r() * 3), carreira: 3 + Math.floor(r() * 3) },
    };
  }
  s.weeks[D.key(mon)] = {
    feeling: 'Hoje foi mais corrido que o normal, mas consegui equilibrar bem treino e trabalho.',
    good: 'Um café da manhã tranquilo antes de sair de casa.',
    insights: 'Percebi que meço meu valor pela produtividade — quero praticar terminar o dia reconhecendo o que deu certo.',
    q1: '', q2: '', q3: '',
    ratings: { saude: 4, sono: 3, estudo: 4, financas: 3, carreira: 4 },
  };

  s.records = [
    { id: uid(), text: 'Agachamento: 60kg' },
    { id: uid(), text: '5km em 28min' },
  ];
  s.books = [
    { id: uid(), title: 'Essencialismo', author: 'Greg McKeown', total: 272, read: 222 },
    { id: uid(), title: 'O Poder do Hábito', author: 'Charles Duhigg', total: 408, read: 102 },
  ];

  const cur = D.monthKey(today);
  for (let j = 3; j >= 0; j--) {
    const mk = D.addMonths(cur, -j);
    const v = base => Math.round((base * (0.85 + r() * 0.3)) / 10) * 10;
    s.finance.months[mk] = {
      income: 5200 + Math.round(r() * 12) * 50,
      categories: {
        'Moradia': 1800,
        'Alimentação': v(1250),
        'Transporte': v(680),
        'Lazer': j === 0 ? v(300) : v(540),
        'Assinaturas e cursos': v(380),
      },
    };
    if (j > 0) s.finance.months[mk].invoice = { name: `fatura-${mk}.pdf`, at: Date.now() - j * 30 * 864e5 };
  }
  s.finance.goals = [
    { id: uid(), name: 'Reserva de emergência', target: 15000, current: 9300 },
    { id: uid(), name: 'Viagem (Portugal, 2027)', target: 12000, current: 4560 },
    { id: uid(), name: 'Investimentos do ano', target: 10000, current: 8000 },
  ];

  const now = Date.now();
  s.career = [
    {
      id: uid(), name: 'Trabalho (CLT)', desc: 'Plano de ação da frente principal',
      metrics: [{ id: uid(), label: 'Propostas ativas', value: 4 }, { id: uid(), label: 'Reuniões na semana', value: 3 }],
      projects: [
        { id: uid(), name: 'Prospecção de novos clientes e parcerias', progress: 60, updatedAt: now - 2 * 864e5 },
        { id: uid(), name: 'Follow-up de propostas em aberto', progress: 30, updatedAt: now - 9 * 864e5 },
        { id: uid(), name: 'Fechamento de contratos do trimestre', progress: 90, updatedAt: now - 4 * 864e5 },
      ],
    },
    {
      id: uid(), name: 'Projeto paralelo', desc: 'Criação de conteúdo e parcerias',
      metrics: [{ id: uid(), label: 'Seguidores no mês', value: 320 }, { id: uid(), label: 'Parcerias fechadas', value: 2 }],
      projects: [
        { id: uid(), name: 'Calendário de conteúdo da semana', progress: 65, updatedAt: now - 1 * 864e5 },
        { id: uid(), name: 'Negociação com marcas parceiras', progress: 45, updatedAt: now - 12 * 864e5 },
        { id: uid(), name: 'Gravação e edição de vídeos', progress: 100, updatedAt: now - 20 * 864e5 },
      ],
    },
  ];
  return s;
}

/* Completa campos que faltarem (ex.: backup antigo importado) */
function normalize(raw) {
  const base = defaultState();
  const s = Object.assign(base, raw || {});
  s.settings = Object.assign(defaultState().settings, (raw && raw.settings) || {});
  s.finance = Object.assign({ categories: [], months: {}, goals: [] }, s.finance || {});
  ['days', 'weeks'].forEach(k => { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
  ['rituals', 'records', 'books', 'career'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  s.career.forEach(f => { f.metrics = f.metrics || []; f.projects = f.projects || []; });
  return s;
}

const Store = {
  state: null,
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.state = raw ? normalize(JSON.parse(raw)) : sampleState();
    } catch (e) {
      this.state = sampleState();
    }
  },
  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); return true; }
    catch (e) { return false; }
  },
  day(k) { return this.state.days[k] || (this.state.days[k] = {}); },
  week(k) { return this.state.weeks[k] || (this.state.weeks[k] = { ratings: {} }); },
  month(mk) { return this.state.finance.months[mk] || (this.state.finance.months[mk] = { income: 0, categories: {} }); },
};

/* ---------- Cálculos derivados do histórico ---------- */
const Calc = {
  dayVal(k) { return Store.state.days[k] || {}; },
  range(start, n) { return Array.from({ length: Math.max(0, n) }, (_, i) => D.add(start, i)); },
  weekDays(mon) { return Calc.range(mon, 7); },
  upToToday(dates) { const t = D.today(); return dates.filter(d => d <= t); },

  trainsIn(dates) { return dates.filter(d => Calc.dayVal(D.key(d)).trained).length; },
  trains(mon) { return Calc.trainsIn(Calc.weekDays(mon)); },
  sleepAvg(dates) {
    const v = dates.map(d => Calc.dayVal(D.key(d)).sleep).filter(x => x > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  },
  energyAvg(dates) {
    const v = dates.map(d => Calc.dayVal(D.key(d)).energy).filter(x => x > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  },
  pages(dates) { return dates.reduce((a, d) => a + (Calc.dayVal(D.key(d)).pages || 0), 0); },

  /* Sequência de dias cumprindo a condição. Se hoje ainda não foi feito, conta a partir de ontem. */
  streak(pred) {
    let d = D.today();
    if (!pred(Calc.dayVal(D.key(d)))) d = D.add(d, -1);
    let n = 0;
    while (pred(Calc.dayVal(D.key(d))) && n < 3650) { n++; d = D.add(d, -1); }
    return n;
  },
  readStreak() { const g = Store.state.settings.pagesGoal; return Calc.streak(v => (v.pages || 0) >= g && g > 0); },
  habitStreak() { return Calc.streak(v => !!v.habit); },

  trainRecord() {
    const counts = {};
    Object.entries(Store.state.days).forEach(([k, v]) => {
      if (!v.trained) return;
      const m = D.key(D.monday(D.parse(k)));
      counts[m] = (counts[m] || 0) + 1;
    });
    return Math.max(0, ...Object.values(counts));
  },

  monthDates(mk) {
    const [y, m] = mk.split('-').map(Number);
    return Calc.range(new Date(y, m - 1, 1), new Date(y, m, 0).getDate());
  },
  income(mk) { return +((Store.state.finance.months[mk] || {}).income) || 0; },
  expenses(mk) {
    const m = Store.state.finance.months[mk];
    if (!m || !m.categories) return 0;
    return Object.values(m.categories).reduce((a, b) => a + (+b || 0), 0);
  },
  goalPct(g) { return g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0; },

  mindAvg(wk) {
    const w = Store.state.weeks[wk];
    if (!w || !w.ratings) return 0;
    const v = Object.values(w.ratings).filter(x => x > 0);
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length) * 2 : 0;
  },
  weekHasCheckin(w) {
    if (!w) return false;
    return ['feeling', 'good', 'insights', 'q1', 'q2', 'q3'].some(f => (w[f] || '').trim()) ||
      Object.values(w.ratings || {}).some(x => x > 0);
  },

  projects() { return Store.state.career.flatMap(f => f.projects); },
  careerAvg() {
    const p = Calc.projects();
    return p.length ? Math.round(p.reduce((a, b) => a + (b.progress || 0), 0) / p.length) : 0;
  },

  /* Regras de "pilar em dia" usadas na visão geral */
  status() {
    const S = Store.state, s = S.settings, today = D.today(), mon = D.monday(today);
    const elapsed = D.daysBetween(mon, today) + 1;
    const past = Calc.range(mon, elapsed);

    const tr = Calc.trains(mon);
    const expected = Math.floor((s.trainGoal * elapsed) / 7);
    const sl = Calc.sleepAvg(past);
    const wk = D.key(mon);
    const mindDone = Calc.weekHasCheckin(S.weeks[wk]);
    const rs = Calc.readStreak();
    const mk = D.monthKey(today), pmk = D.addMonths(mk, -1);
    const fm = S.finance.months[mk] || {};
    const prevInvoice = !!(S.finance.months[pmk] || {}).invoice;
    const finOk = !!fm.invoice || prevInvoice || Calc.income(mk) > 0 || Calc.expenses(mk) > 0;
    const weekAgo = Date.now() - 7 * 864e5;
    const careerOk = Calc.projects().some(p => (p.updatedAt || 0) >= weekAgo);
    const shortMonth = MONTHS_SHORT[today.getMonth()].toLowerCase();

    return [
      { id: 'saude', ok: tr >= expected, indicator: `${tr}/${s.trainGoal} treinos essa semana`, goal: `${s.trainGoal} treinos por semana`, rule: 'treinos acompanhando o ritmo da meta' },
      { id: 'sono', ok: sl > 0 && sl >= s.sleepGoal - 1, indicator: sl ? `média de ${fmt(sl)}h por noite` : 'sem registros', goal: `${fmt(s.sleepGoal)}h por noite`, rule: `média da semana a partir de ${fmt(s.sleepGoal - 1)}h` },
      { id: 'mente', ok: mindDone, indicator: mindDone ? `nota da semana: ${fmt(Calc.mindAvg(wk))}/10` : 'check-in pendente', goal: 'check-in semanal', rule: 'check-in da semana feito' },
      { id: 'estudo', ok: rs > 0, indicator: `${rs} ${rs === 1 ? 'dia seguido' : 'dias seguidos'} lendo`, goal: `${s.pagesGoal} páginas por dia`, rule: 'meta diária cumprida ontem ou hoje' },
      { id: 'financas', ok: finOk, indicator: fm.invoice ? `fatura de ${shortMonth} enviada` : (finOk ? 'mês em lançamento' : `fatura de ${shortMonth} pendente`), goal: 'fatura e gastos do mês', rule: 'mês com lançamentos ou fatura enviada' },
      { id: 'carreira', ok: careerOk, indicator: `${Calc.careerAvg()}% das metas`, goal: 'avançar toda semana', rule: 'algum projeto avançou nos últimos 7 dias' },
    ];
  },
};
