'use strict';
/* ==========================================================
   Telas: visão geral, os 6 pilares e configurações
   ========================================================== */

const Views = {};

/* ---------------- Visão geral ---------------- */
function overviewSeries(metric, period) {
  const s = Store.state.settings, today = D.today();
  const valueOf = dates => metric === 'treinos' ? Calc.trainsIn(dates) : metric === 'sono' ? Calc.sleepAvg(dates) : Calc.pages(dates);
  if (period === 'semanas') {
    const mon = D.monday(today);
    return {
      items: [5, 4, 3, 2, 1, 0].map(i => {
        const m = D.add(mon, -7 * i);
        return { label: i === 0 ? 'Esta' : `${m.getDate()}/${m.getMonth() + 1}`, value: valueOf(Calc.upToToday(Calc.weekDays(m))), hl: i === 0 };
      }),
      goal: metric === 'treinos' ? s.trainGoal : metric === 'sono' ? s.sleepGoal : s.pagesGoal * 7,
    };
  }
  const cur = D.monthKey(today);
  return {
    items: [5, 4, 3, 2, 1, 0].map(i => {
      const mk = D.addMonths(cur, -i);
      const m = Number(mk.split('-')[1]);
      return { label: MONTHS_SHORT[m - 1], value: valueOf(Calc.upToToday(Calc.monthDates(mk))), hl: i === 0 };
    }),
    goal: metric === 'sono' ? s.sleepGoal : 0,
  };
}

Views.visao = () => {
  const S = Store.state, s = S.settings, ui = UI.state, today = D.today(), mon = D.monday(today);
  const st = Calc.status(), ok = st.filter(x => x.ok).length, pct = Math.round((ok / 6) * 100);
  const elapsed = D.daysBetween(mon, today) + 1;
  const cur = Calc.range(mon, elapsed), prev = Calc.range(D.add(mon, -7), elapsed);

  const trC = Calc.trainsIn(cur), trP = Calc.trainsIn(prev);
  const slC = Calc.sleepAvg(cur), slP = Calc.sleepAvg(prev);
  const pgC = Calc.pages(cur), pgP = Calc.pages(prev);

  const metricPills = [['treinos', 'Treinos'], ['sono', 'Sono'], ['leitura', 'Leitura']].map(([k, l]) =>
    `<button class="pill ${ui.ovMetric === k ? 'active' : ''}" data-action="setUi" data-key="ovMetric" data-value="${k}">${l}</button>`).join('');
  const periodPills = [['semanas', 'Semanas'], ['meses', 'Meses']].map(([k, l]) =>
    `<button class="pill ${ui.ovPeriod === k ? 'active' : ''}" data-action="setUi" data-key="ovPeriod" data-value="${k}">${l}</button>`).join('');

  const series = overviewSeries(ui.ovMetric, ui.ovPeriod);
  const unit = ui.ovMetric === 'sono' ? 'h' : ui.ovMetric === 'leitura' ? ' pág' : '';
  const chartTitle = { treinos: 'Treinos concluídos', sono: 'Média de sono', leitura: 'Páginas lidas' }[ui.ovMetric];

  const calMon = D.add(mon, 7 * ui.calOffset), mid = D.add(calMon, 3);
  const cal = Calc.weekDays(calMon).map((d, i) => {
    const k = D.key(d), v = Calc.dayVal(k);
    const marks = [v.trained, (v.pages || 0) >= s.pagesGoal, (v.sleep || 0) >= s.sleepGoal - 1];
    return `<div class="cal-col ${k === D.key(today) ? 'active' : ''} ${d > today ? 'future' : ''}">
      <span>${WEEKDAYS[i]}</span><b>${d.getDate()}</b>
      <i class="marks">${marks.map(m => `<em class="${m ? 'on' : ''}"></em>`).join('')}</i>
    </div>`;
  }).join('');

  const rows = st.map(x => {
    const p = pillar(x.id);
    return `<tr class="clickable" data-nav="${p.id}">
      <td><div class="pillar-cell"><span class="pillar-ic">${icon(p.icon)}</span>${esc(p.name)}</div></td>
      <td>${esc(x.indicator)}</td>
      <td class="muted col-meta">${esc(x.goal)}</td>
      <td><span class="badge ${x.ok ? 'dark' : 'light'}" title="${esc(x.rule)}">${x.ok ? 'Em dia' : 'Atenção'}</span></td>
    </tr>`;
  }).join('');

  return `
  ${pageHeader({
    eyebrow: 'Visão geral',
    title: s.name ? `Olá, ${s.name}` : 'Painel da Vida',
    desc: 'Seis pilares, um plano de ação e a evolução de cada um. Toque em um pilar para abrir os detalhes.',
    right: `<span class="date-pill">${icon('calendar')} ${esc(rangeLabel(mon))}</span>`,
  })}

  <div class="stats">
    ${statCard({ label: 'Consistência da semana', value: ok, unit: '/ 6 pilares em dia', foot: footText(`${longDate(today)} · semana em andamento`), dark: true })}
    ${statCard({ label: 'Treinos na semana', value: trC, unit: `/ ${s.trainGoal}`, foot: trend(trC, trP) })}
    ${statCard({ label: 'Média de sono', value: fmt(slC), unit: 'h por noite', foot: trend(slC, slP) })}
    ${statCard({ label: 'Páginas lidas', value: pgC, unit: 'na semana', foot: trend(pgC, pgP) })}
  </div>

  <div class="grid g-21">
    ${card({
      title: chartTitle,
      sub: ui.ovPeriod === 'semanas' ? 'Últimas 6 semanas' : 'Últimos 6 meses',
      right: `<div class="pills on-card">${metricPills}<span style="width:6px"></span>${periodPills}</div>`,
      body: barChart({ items: series.items, goal: series.goal, unit, fmtV: v => fmt(v) }),
    })}
    <div class="stack">
      ${card({
        body: `
          <div class="cal-head">
            <button class="icon-btn plain" data-action="shift" data-key="calOffset" data-delta="-1" aria-label="Semana anterior">${icon('left')}</button>
            <span>${cap(MONTHS[mid.getMonth()])} ${mid.getFullYear()}</span>
            <button class="icon-btn plain" data-action="shift" data-key="calOffset" data-delta="1" ${ui.calOffset >= 0 ? 'disabled' : ''} aria-label="Próxima semana">${icon('right')}</button>
          </div>
          <div class="cal">${cal}</div>
          <div class="legend">pontos: treino · leitura na meta · sono na meta</div>`,
      })}
      ${card({
        body: `<div class="donut-row">
          <div><div class="card-title">Pilares em dia</div><div class="trend" style="margin-top:6px">${ok} de 6 nesta semana</div></div>
          ${donut(pct)}
        </div>`,
      })}
    </div>
  </div>

  <section class="card flush">
    <div class="card-head">
      <div><div class="card-title">Pilares</div><div class="card-sub">Situação de cada pilar nesta semana</div></div>
      <button class="icon-btn" data-nav="mente" title="Fazer check-in" aria-label="Fazer check-in">${icon('arrow')}</button>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Pilar</th><th>Indicador</th><th class="col-meta">Meta</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
};

/* ---------------- 01 · Saúde ---------------- */
Views.saude = () => {
  const S = Store.state, s = S.settings, ui = UI.state, today = D.today(), tk = D.key(today);
  const thisMon = D.monday(today);
  const mon = D.add(thisMon, 7 * ui.trainOffset);
  const tr = Calc.trains(mon);

  const last6 = [5, 4, 3, 2, 1, 0].map(i => ({ label: i === 0 ? 'Esta' : `S-${i}`, value: Calc.trains(D.add(thisMon, -7 * i)), hl: i === 0 }));
  const lastWeek = last6[4].value;
  const avg = last6.slice(0, 5).reduce((a, b) => a + b.value, 0) / 5;

  const strip = Calc.weekDays(mon).map((d, i) => {
    const k = D.key(d), done = !!Calc.dayVal(k).trained;
    return `<button class="day ${done ? 'done' : ''} ${k === tk ? 'today' : ''}" data-action="toggleTrain" data-date="${k}" ${d > today ? 'disabled' : ''} aria-pressed="${done}"><span class="dot"></span>${WEEKDAYS[i]}</button>`;
  }).join('');

  const habitDays = Calc.range(D.add(today, -13), 14).map(d => {
    const k = D.key(d), on = !!Calc.dayVal(k).habit;
    return `<button class="${on ? 'on' : ''} ${k === tk ? 'today' : ''}" data-action="toggleHabit" data-date="${k}" title="${d.getDate()}/${d.getMonth() + 1}" aria-label="${d.getDate()}/${d.getMonth() + 1}${on ? ' feito' : ''}"></button>`;
  }).join('');
  const habitToday = !!Calc.dayVal(tk).habit;
  const hs = Calc.habitStreak();

  const records = S.records.length
    ? S.records.map(r => `<div class="row"><div class="grow">${esc(r.text)}</div>${removeBtn(`data-list="records" data-id="${r.id}"`)}</div>`).join('')
    : '<div class="empty">Nenhum recorde ainda. Registre o primeiro acima.</div>';

  return `
  ${pillarHeader('saude', 'Marque os dias em que treinou. A meta, a sequência e os gráficos se atualizam sozinhos.')}

  <div class="stats">
    ${statCard({ label: 'Treinos essa semana', value: Calc.trains(thisMon), unit: `/ ${s.trainGoal}`, foot: footText(`semana passada: ${lastWeek}`), dark: true })}
    ${statCard({ label: s.habitName || 'Hábito diário', value: hs, unit: hs === 1 ? 'dia seguido' : 'dias seguidos', foot: footText(habitToday ? 'feito hoje' : 'ainda não marcado hoje') })}
    ${statCard({ label: 'Recorde numa semana', value: Calc.trainRecord(), unit: 'treinos' })}
    ${statCard({ label: 'Média (5 semanas)', value: fmt(avg), unit: 'treinos/semana', foot: trend(Calc.trains(thisMon), avg, { suffix: 'esta semana vs média' }) })}
  </div>

  <div class="grid g-2">
    ${card({
      title: ui.trainOffset === 0 ? 'Treinos essa semana' : 'Treinos da semana',
      sub: `${rangeLabel(mon)} · toque para marcar`,
      right: `<div class="pills">
        <button class="icon-btn" data-action="shift" data-key="trainOffset" data-delta="-1" aria-label="Semana anterior">${icon('left')}</button>
        <button class="icon-btn" data-action="shift" data-key="trainOffset" data-delta="1" ${ui.trainOffset >= 0 ? 'disabled' : ''} aria-label="Próxima semana">${icon('right')}</button>
      </div>`,
      body: `<div class="days">${strip}</div>
        <div class="card-foot">
          <div class="kv"><span>Meta da semana</span><b>${tr} / ${s.trainGoal}</b></div>
          ${progress((tr / Math.max(1, s.trainGoal)) * 100, 'thick')}
        </div>`,
    })}
    ${card({
      title: 'Últimas 6 semanas',
      sub: 'Treinos concluídos por semana',
      body: barChart({ items: last6, goal: s.trainGoal, height: 170 }),
    })}
  </div>

  <div class="grid g-2">
    ${card({
      title: s.habitName || 'Hábito diário',
      sub: 'Últimos 14 dias · toque para corrigir um dia',
      right: `<button class="btn ${habitToday ? '' : 'ghost'}" data-action="toggleHabit" data-date="${tk}">${habitToday ? `${icon('check')} Feito hoje` : 'Marcar hoje'}</button>`,
      body: `<div class="mini-days">${habitDays}</div>
        <div class="card-foot"><div class="kv"><span>Sequência atual</span><b>${hs} ${hs === 1 ? 'dia' : 'dias'}</b></div></div>
        <div class="tip">O nome deste hábito pode ser trocado em Configurações.</div>`,
    })}
    ${card({
      title: 'Recordes pessoais',
      sub: 'Registre um PR para acompanhar sua evolução',
      body: `<form class="inline-form" data-submit="addRecord" style="margin-bottom:14px">
          <input class="input" name="text" placeholder="ex: agachamento 60kg, 5km em 28min..." maxlength="120" required>
          <button class="btn" type="submit">Adicionar</button>
        </form>
        <div class="list-editor">${records}</div>`,
    })}
  </div>`;
};

/* ---------------- 02 · Sono ---------------- */
Views.sono = () => {
  const S = Store.state, s = S.settings, ui = UI.state, today = D.today(), tk = D.key(today);
  const mon = D.monday(today);
  const past = Calc.upToToday(Calc.weekDays(mon));
  if (D.parse(ui.sleepDay) > today || D.parse(ui.sleepDay) < mon) ui.sleepDay = tk;
  const sel = ui.sleepDay, selDate = D.parse(sel), selVal = Calc.dayVal(sel);

  const items = Calc.weekDays(mon).map((d, i) => {
    const k = D.key(d);
    return { label: WEEKDAYS[i], value: Calc.dayVal(k).sleep || 0, key: k, hl: k === tk, selected: k === sel };
  });
  const avg = Calc.sleepAvg(past);
  const prevAvg = Calc.sleepAvg(Calc.weekDays(D.add(mon, -7)));
  const goodNights = past.filter(d => (Calc.dayVal(D.key(d)).sleep || 0) >= s.sleepGoal - 1).length;
  const energy = Calc.energyAvg(past);
  const todayRit = Calc.dayVal(tk).rituals || {};
  const ritDone = S.rituals.filter(r => todayRit[r.id]).length;

  const weeks6 = [5, 4, 3, 2, 1, 0].map(i => {
    const m = D.add(mon, -7 * i);
    return { label: i === 0 ? 'Esta' : `S-${i}`, value: Math.round(Calc.sleepAvg(Calc.upToToday(Calc.weekDays(m))) * 10) / 10, hl: i === 0 };
  });

  const selLabel = sel === tk ? 'Hoje' : `${WEEKDAYS[(selDate.getDay() + 6) % 7]}, ${selDate.getDate()}/${selDate.getMonth() + 1}`;

  const rituals = S.rituals.length
    ? S.rituals.map(r => {
      const on = !!todayRit[r.id];
      return `<div class="row"><div class="grow row-title" style="font-weight:500">${esc(r.name)}</div>
        <button class="toggle-btn ${on ? 'on' : ''}" data-action="toggleRitual" data-id="${r.id}" data-date="${tk}" aria-pressed="${on}">${on ? 'feito' : 'marcar'}</button></div>`;
    }).join('')
    : '<div class="empty">Nenhum ritual cadastrado. Adicione em Configurações.</div>';

  return `
  ${pillarHeader('sono', 'Horas de sono por noite, energia ao acordar e os rituais que ajudam a dormir melhor.')}

  <div class="stats">
    ${statCard({ label: 'Média da semana', value: fmt(avg), unit: 'h por noite', foot: trend(avg, prevAvg), dark: true })}
    ${statCard({ label: `Noites com ${fmt(s.sleepGoal - 1)}h ou mais`, value: goodNights, unit: `de ${past.length} nesta semana` })}
    ${statCard({ label: 'Energia ao acordar', value: fmt(energy), unit: '/ 5 em média' })}
    ${statCard({ label: 'Rituais hoje', value: ritDone, unit: `/ ${S.rituals.length}`, foot: footText(ritDone === S.rituals.length && ritDone ? 'todos feitos 🌙' : 'toque para marcar abaixo') })}
  </div>

  <div class="grid g-21">
    ${card({
      title: 'Horas de sono',
      sub: 'Seg a dom · toque numa barra para editar o dia',
      body: `${barChart({ items, goal: s.sleepGoal, unit: 'h', action: 'selectSleepDay', height: 180 })}
        <div class="card-foot" style="display:flex;flex-wrap:wrap;gap:20px 36px;align-items:center">
          <div>
            <div class="field-label" style="margin-bottom:8px">${esc(selLabel)}</div>
            <div class="stepper">
              <button data-action="sleepStep" data-delta="-0.5" aria-label="Menos meia hora">–</button>
              <span class="val">${fmt(selVal.sleep || 0)}h</span>
              <button data-action="sleepStep" data-delta="0.5" aria-label="Mais meia hora">+</button>
            </div>
          </div>
          <div>
            <div class="field-label" style="margin-bottom:10px">Energia ao acordar</div>
            ${rating(selVal.energy || 0, `data-action="setEnergy" data-date="${sel}"`, 'lg')}
          </div>
        </div>`,
    })}
    ${card({
      title: 'Rituais pra dormir melhor',
      sub: 'Toque para marcar o que você fez hoje',
      body: rituals,
    })}
  </div>

  ${card({
    title: 'Média por semana',
    sub: 'Últimas 6 semanas',
    body: barChart({ items: weeks6, goal: s.sleepGoal, unit: 'h', height: 150 }),
  })}`;
};

/* ---------------- 03 · Mente ---------------- */
Views.mente = () => {
  const S = Store.state, ui = UI.state, today = D.today();
  const thisMon = D.monday(today);
  const mon = D.add(thisMon, 7 * ui.mindOffset);
  const wk = D.key(mon);
  const w = S.weeks[wk] || { ratings: {} };
  const ratings = w.ratings || {};
  const others = PILLARS.filter(p => p.id !== 'mente');

  const rated = others.filter(p => ratings[p.id] > 0);
  const best = rated.length ? rated.reduce((a, b) => (ratings[b.id] > ratings[a.id] ? b : a)) : null;
  const worst = rated.length ? rated.reduce((a, b) => (ratings[b.id] < ratings[a.id] ? b : a)) : null;
  const checkins = Object.values(S.weeks).filter(Calc.weekHasCheckin).length;
  const avg = Calc.mindAvg(wk);
  const prevAvg = Calc.mindAvg(D.key(D.add(mon, -7)));

  const field = (f, ph, rows = 3) =>
    `<textarea class="input" rows="${rows}" data-input="mind" data-week="${wk}" data-field="${f}" data-k="mind-${f}" placeholder="${esc(ph)}">${esc(w[f] || '')}</textarea>`;

  const ratingRows = others.map(p => `
    <div class="row">
      <div class="grow" style="display:flex;align-items:center;gap:10px;font-weight:600">${icon(p.icon)} ${esc(p.short)}</div>
      ${rating(ratings[p.id] || 0, `data-action="setRating" data-week="${wk}" data-p="${p.id}"`)}
    </div>`).join('');

  const hist = [5, 4, 3, 2, 1, 0].map(i => {
    const m = D.add(thisMon, -7 * i);
    return { label: i === 0 ? 'Esta' : `${m.getDate()}/${m.getMonth() + 1}`, value: Math.round(Calc.mindAvg(D.key(m)) * 10) / 10, hl: i === 0 };
  });

  return `
  ${pillarHeader('mente', 'Como você está, o que aprendeu e como foi a semana: terapia, leituras e reflexões num lugar só.',
    navGroup({
      label: ui.mindOffset === 0 ? 'Esta semana' : rangeLabel(mon),
      prevAttrs: 'data-action="shift" data-key="mindOffset" data-delta="-1"',
      nextAttrs: 'data-action="shift" data-key="mindOffset" data-delta="1"',
      nextDisabled: ui.mindOffset >= 0,
    }))}

  <div class="stats">
    ${statCard({ label: 'Nota da semana', value: avg ? fmt(avg) : '—', unit: '/ 10', foot: trend(avg, prevAvg), dark: true })}
    ${statCard({ label: 'Pilar mais forte', value: best ? esc(best.short) : '—', foot: footText(best ? `nota ${ratings[best.id]} de 5` : 'dê notas abaixo') })}
    ${statCard({ label: 'Pilar para cuidar', value: worst ? esc(worst.short) : '—', foot: footText(worst ? `nota ${ratings[worst.id]} de 5` : 'dê notas abaixo') })}
    ${statCard({ label: 'Check-ins registrados', value: checkins, unit: checkins === 1 ? 'semana' : 'semanas' })}
  </div>

  <div class="grid g-2">
    ${card({
      title: 'Check-in emocional',
      sub: `Semana de ${rangeLabel(mon)} · salva automaticamente`,
      body: `<div class="field" style="margin-bottom:14px"><label>Como você está?</label>${field('feeling', 'Escreva livremente como foi a semana...', 4)}</div>
        <div class="field"><label>Uma coisa boa</label>
          <input class="input" data-input="mind" data-week="${wk}" data-field="good" data-k="mind-good" value="${esc(w.good || '')}" placeholder="ex: um café da manhã tranquilo">
        </div>`,
    })}
    ${card({
      title: 'Nota para cada pilar',
      sub: 'De 1 a 5: como cada área foi nesta semana',
      body: ratingRows,
    })}
  </div>

  <div class="grid g-2">
    ${card({
      title: 'Insights & aprendizados',
      sub: 'Principais aprendizados da semana: terapia, leituras, o que vier',
      body: field('insights', 'O que ficou de aprendizado?', 6),
    })}
    ${card({
      title: 'Perguntas da semana',
      sub: 'Três perguntas fixas para fechar a semana',
      body: `<div class="field" style="margin-bottom:12px"><label>O que funcionou bem?</label>${field('q1', '', 2)}</div>
        <div class="field" style="margin-bottom:12px"><label>O que quero fazer diferente?</label>${field('q2', '', 2)}</div>
        <div class="field"><label>Qual vitória quero reconhecer?</label>${field('q3', '', 2)}</div>`,
    })}
  </div>

  ${card({ title: 'Nota média por semana', sub: 'Últimas 6 semanas (escala de 0 a 10)', body: barChart({ items: hist, height: 150 }) })}`;
};

/* ---------------- 04 · Estudo ---------------- */
Views.estudo = () => {
  const S = Store.state, s = S.settings, today = D.today(), tk = D.key(today);
  const pagesToday = Calc.dayVal(tk).pages || 0;
  const rs = Calc.readStreak();
  const milestone = [7, 14, 30, 60, 100, 180, 365].find(m => m > rs) || rs + 1;
  const last14 = Calc.range(D.add(today, -13), 14);
  const pages14 = Calc.pages(last14);
  const rhythm = pages14 / 14;

  const strip = Calc.range(D.add(today, -6), 7).map((d, i) => {
    const k = D.key(d), done = (Calc.dayVal(k).pages || 0) >= s.pagesGoal;
    const label = i === 6 ? 'Hoje' : `D-${6 - i}`;
    return `<button class="day ${done ? 'done' : ''} ${k === tk ? 'today' : ''}" data-action="togglePages" data-date="${k}" aria-pressed="${done}" title="${Calc.dayVal(k).pages || 0} páginas"><span class="dot"></span>${label}</button>`;
  }).join('');

  const chartItems = last14.map(d => {
    const k = D.key(d);
    return { label: String(d.getDate()), value: Calc.dayVal(k).pages || 0, hl: k === tk };
  });

  const active = S.books.filter(b => b.read < b.total);
  const done = S.books.filter(b => b.read >= b.total);
  const bookRow = b => {
    const pct = b.total ? Math.round((b.read / b.total) * 100) : 0;
    const left = Math.max(0, b.total - b.read);
    const days = rhythm > 0 ? Math.ceil(left / rhythm) : null;
    return `<div class="row" style="align-items:flex-start">
      <div class="grow">
        <div style="display:flex;justify-content:space-between;gap:8px"><div><div class="row-title">${esc(b.title)}</div><div class="row-sub">${esc(b.author || '')}</div></div><span class="pct">${pct}%</span></div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
          <div style="flex:1">${progress(pct)}</div>
          <button class="btn ghost sm" data-action="bookAdd" data-id="${b.id}" data-n="10">+10 páginas</button>
          ${removeBtn(`data-list="books" data-id="${b.id}"`)}
        </div>
        <div class="row-meta">${b.read} de ${b.total} páginas · faltam ${left}${days ? ` · ~${days} ${days === 1 ? 'dia' : 'dias'} no ritmo atual` : ''}</div>
      </div>
    </div>`;
  };

  return `
  ${pillarHeader('estudo', `A meta de ${s.pagesGoal} páginas por dia e os livros que você está lendo agora.`)}

  <div class="stats">
    ${statCard({ label: 'Páginas hoje', value: pagesToday, unit: `/ ${s.pagesGoal}`, foot: footText(pagesToday >= s.pagesGoal ? 'meta de hoje cumprida ✓' : `faltam ${s.pagesGoal - pagesToday} páginas`), dark: true })}
    ${statCard({ label: 'Sequência atual', value: rs, unit: rs === 1 ? 'dia' : 'dias', foot: footText(`próximo marco: ${milestone} dias`) })}
    ${statCard({ label: 'Últimos 14 dias', value: pages14, unit: 'páginas', foot: footText(`ritmo de ${fmt(rhythm)} páginas/dia`) })}
    ${statCard({ label: 'Livros', value: active.length, unit: 'em andamento', foot: footText(`${done.length} ${done.length === 1 ? 'concluído' : 'concluídos'}`) })}
  </div>

  <div class="grid g-2">
    ${card({
      title: `${s.pagesGoal} páginas por dia`,
      sub: 'Últimos 7 dias · toque para marcar a meta do dia',
      body: `<div class="days">${strip}</div>
        <div class="card-foot" style="display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center;justify-content:space-between">
          <div>
            <div class="field-label" style="margin-bottom:8px">Páginas lidas hoje</div>
            <div class="stepper">
              <button data-action="pagesStep" data-delta="-5" aria-label="Menos 5 páginas">–</button>
              <input class="input" type="number" min="0" inputmode="numeric" value="${pagesToday}" data-change="pagesToday" data-k="pages-today" aria-label="Páginas lidas hoje">
              <button data-action="pagesStep" data-delta="5" aria-label="Mais 5 páginas">+</button>
            </div>
          </div>
          <div style="flex:1;min-width:180px">
            <div class="kv"><span>Sequência atual</span><b>${rs} ${rs === 1 ? 'dia' : 'dias'}</b></div>
            ${progress((rs / milestone) * 100)}
          </div>
        </div>`,
    })}
    ${card({
      title: 'Páginas lidas · últimos 14 dias',
      sub: 'Linha pontilhada = meta diária',
      body: barChart({ items: chartItems, goal: s.pagesGoal, unit: ' pág', height: 170 }),
    })}
  </div>

  ${card({
    title: 'Livros sendo lidos',
    sub: 'Toque em "+10 páginas" conforme for avançando (também soma nas páginas de hoje)',
    body: `${active.length ? active.map(bookRow).join('') : '<div class="empty">Nenhum livro em andamento.</div>'}
      <form class="form-grid card-foot" data-submit="addBook">
        <input class="input" name="title" placeholder="Título do livro" required maxlength="120">
        <input class="input" name="author" placeholder="Autor" maxlength="80">
        <input class="input" name="total" type="number" min="1" placeholder="Nº de páginas" required>
        <button class="btn" type="submit">${icon('plus')} Adicionar</button>
      </form>
      ${done.length ? `<div class="card-foot"><div class="field-label" style="margin-bottom:8px">Concluídos</div>${done.map(b =>
        `<div class="row"><div class="grow"><span class="row-title">${esc(b.title)}</span> <span class="row-sub">· ${esc(b.author || '')} · ${b.total} páginas</span></div><span class="badge dark">Lido</span>${removeBtn(`data-list="books" data-id="${b.id}"`)}</div>`).join('')}</div>` : ''}`,
  })}`;
};

/* ---------------- 05 · Finanças ---------------- */
Views.financas = () => {
  const S = Store.state, ui = UI.state, today = D.today();
  const mk = ui.finMonth, pmk = D.addMonths(mk, -1), curMk = D.monthKey(today);
  const m = S.finance.months[mk] || { income: 0, categories: {} };
  const inc = Calc.income(mk), exp = Calc.expenses(mk), incP = Calc.income(pmk), expP = Calc.expenses(pmk);
  const saldo = inc - exp;
  const goals = S.finance.goals;
  const goalsAvg = goals.length ? Math.round(goals.reduce((a, g) => a + Calc.goalPct(g), 0) / goals.length) : 0;
  const shortName = mkx => MONTHS_SHORT[Number(mkx.split('-')[1]) - 1];

  const chips = [3, 2, 1, 0].map(i => {
    const k = D.addMonths(mk, -i), has = !!(S.finance.months[k] || {}).invoice;
    return `<button class="chip ${has ? 'on' : ''} ${k === mk ? 'current' : ''}" data-action="setUi" data-key="finMonth" data-value="${k}">${has ? icon('check') : '·'} ${shortName(k)}</button>`;
  }).join('');

  const invoice = m.invoice
    ? `<div class="file-ok">${icon('file')}<span class="grow" title="${esc(m.invoice.name)}">${esc(m.invoice.name)}</span>
        <span class="small muted">${new Date(m.invoice.at).toLocaleDateString('pt-BR')}</span>
        <button class="icon-btn plain" data-action="removeInvoice" data-month="${mk}" aria-label="Remover fatura">${icon('x')}</button></div>`
    : `<label class="dropzone">${icon('upload')} Toque para selecionar o PDF ou print da fatura
        <input type="file" accept="application/pdf,image/*" data-change="invoice" data-month="${mk}"></label>`;

  const cats = S.finance.categories.map(name => ({ name, value: +((m.categories || {})[name]) || 0 }))
    .sort((a, b) => b.value - a.value);
  const maxCat = Math.max(1, ...cats.map(c => c.value));
  const shades = ['#151515', '#3b3b3e', '#5f5f64', '#86868c', '#adadb2', '#cbcbd0'];
  const catRows = cats.map((c, i) => `
    <div class="cat-row">
      <span class="small" style="color:var(--ink-2);font-weight:500">${esc(c.name)}</span>
      <div class="cat-bar"><span style="width:${(c.value / maxCat) * 100}%;background:${shades[Math.min(i, shades.length - 1)]}"></span></div>
      <input class="input sm num" type="number" min="0" step="10" value="${c.value || ''}" placeholder="R$ 0" data-change="category" data-month="${mk}" data-name="${esc(c.name)}" data-k="cat-${esc(c.name)}" aria-label="Gasto com ${esc(c.name)}">
    </div>`).join('');

  const goalRows = goals.length ? goals.map(g => {
    const pct = Calc.goalPct(g);
    return `<div class="row" style="align-items:flex-start">
      <div class="grow">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">
          <div class="row-title">${esc(g.name)}</div><span class="pct">${pct}%</span>
        </div>
        <div style="margin:10px 0 8px">${progress(pct)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="row-meta" style="margin:0">${brl(g.current)} de ${brl(g.target)}</span>
          <form class="inline-form" data-submit="contribute" data-id="${g.id}">
            <input class="input sm num" name="amount" type="number" step="10" placeholder="R$" style="width:100px" aria-label="Valor do aporte" required>
            <button class="btn ghost sm" type="submit">Aportar</button>
            ${removeBtn(`data-list="goals" data-id="${g.id}"`)}
          </form>
        </div>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Nenhuma meta ainda.</div>';

  return `
  ${pillarHeader('financas', 'Fatura do mês, receita x despesas, gastos por categoria e metas de longo prazo.',
    navGroup({
      label: monthLabel(mk),
      prevAttrs: 'data-action="shiftMonth" data-delta="-1"',
      nextAttrs: 'data-action="shiftMonth" data-delta="1"',
      nextDisabled: mk >= curMk,
    }))}

  <div class="stats">
    ${statCard({ label: 'Receita', value: brl(inc), foot: trend(inc, incP, { suffix: `vs ${shortName(pmk).toLowerCase()}` }), dark: true })}
    ${statCard({ label: 'Despesas', value: brl(exp), foot: trend(exp, expP, { invert: true, suffix: `vs ${shortName(pmk).toLowerCase()}` }) })}
    ${statCard({ label: 'Saldo do mês', value: brl(saldo), foot: footText(inc ? `${Math.round((saldo / inc) * 100)}% da receita` : 'informe a receita') })}
    ${statCard({ label: 'Metas de longo prazo', value: `${goalsAvg}%`, foot: footText(`média de ${goals.length} ${goals.length === 1 ? 'meta' : 'metas'}`) })}
  </div>

  <div class="grid g-2">
    ${card({
      title: 'Fatura do mês',
      sub: `Envie a fatura de ${MONTHS[Number(mk.split('-')[1]) - 1]}`,
      body: `${invoice}<div class="chips">${chips}</div>
        <div class="tip">O arquivo fica só registrado aqui (nome e data). Dica: envie a fatura para uma IA, peça o total por categoria e lance os valores ao lado.</div>`,
    })}
    ${card({
      title: 'Receita x despesas',
      sub: monthLabel(mk),
      body: `<div class="fields" style="margin-bottom:16px">
          <div class="field"><label for="income">Receita</label>
            <input id="income" class="input num" type="number" min="0" step="50" value="${inc || ''}" placeholder="R$ 0" data-change="income" data-month="${mk}" data-k="income"></div>
          <div class="field"><span class="field-label">Despesas (soma das categorias)</span>
            <div class="input num" style="background:transparent;border-color:var(--line)">${brl(exp)}</div></div>
        </div>
        <div class="kv"><span>Saldo do mês</span><b>${brl(saldo)}</b></div>
        ${progress(inc ? (exp / inc) * 100 : 0, 'thick')}
        <div class="row-meta">${inc ? `${Math.round((exp / inc) * 100)}% da receita já foi gasto` : 'Informe a receita para ver o saldo'}</div>`,
    })}
  </div>

  <div class="grid g-2">
    ${card({
      title: 'Gastos por categoria',
      sub: `${monthLabel(mk)} · ordenado do maior para o menor`,
      body: cats.length ? catRows : '<div class="empty">Cadastre categorias em Configurações.</div>',
    })}
    ${card({
      title: 'Metas de longo prazo',
      sub: 'Registre cada aporte para ver a meta crescer',
      body: `${goalRows}
        <form class="inline-form card-foot" data-submit="addGoal">
          <input class="input" name="name" placeholder="Nova meta (ex: reserva de emergência)" required maxlength="80">
          <input class="input num" name="target" type="number" min="1" placeholder="Valor R$" style="max-width:120px" required>
          <button class="btn" type="submit">${icon('plus')}</button>
        </form>`,
    })}
  </div>`;
};

/* ---------------- 06 · Carreira ---------------- */
Views.carreira = () => {
  const S = Store.state;
  const all = Calc.projects();
  const weekAgo = Date.now() - 7 * 864e5;
  const recent = all.filter(p => (p.updatedAt || 0) >= weekAgo).length;

  const front = f => {
    const metrics = f.metrics.map(mt => `
      <div class="metric">${esc(mt.label)}
        <input class="input sm" type="number" value="${mt.value}" data-change="metric" data-front="${f.id}" data-id="${mt.id}" data-k="metric-${mt.id}" aria-label="${esc(mt.label)}">
        <button class="icon-btn" data-action="remove" data-list="metrics" data-front="${f.id}" data-id="${mt.id}" aria-label="Remover indicador">${icon('x')}</button>
      </div>`).join('');
    const projects = f.projects.length ? f.projects.map(p => `
      <div class="row">
        <div class="grow">
          <div style="display:flex;justify-content:space-between;gap:8px"><span class="row-title" style="font-weight:500">${esc(p.name)}</span><span class="pct">${p.progress}%</span></div>
          <div style="margin-top:9px">${progress(p.progress)}</div>
        </div>
        <button class="btn ghost sm" data-action="projStep" data-front="${f.id}" data-id="${p.id}" data-delta="-10" aria-label="Diminuir 10%">−10%</button>
        <button class="btn ghost sm" data-action="projStep" data-front="${f.id}" data-id="${p.id}" data-delta="10" aria-label="Aumentar 10%">+10%</button>
        ${removeBtn(`data-list="projects" data-front="${f.id}" data-id="${p.id}"`)}
      </div>`).join('') : '<div class="empty">Nenhum projeto nesta frente.</div>';
    const avg = f.projects.length ? Math.round(f.projects.reduce((a, b) => a + b.progress, 0) / f.projects.length) : 0;

    return `<section class="card" style="margin-bottom:16px">
      <div class="card-head">
        <div style="flex:1;min-width:200px">
          <input class="input title-input" value="${esc(f.name)}" data-change="frontField" data-front="${f.id}" data-field="name" data-k="fname-${f.id}" aria-label="Nome da frente">
          <input class="input sub-input" value="${esc(f.desc || '')}" placeholder="Descrição da frente" data-change="frontField" data-front="${f.id}" data-field="desc" data-k="fdesc-${f.id}" aria-label="Descrição da frente">
        </div>
        <div style="display:flex;align-items:center;gap:10px">${donut(avg)}${removeBtn(`data-list="fronts" data-id="${f.id}"`, 'Remover frente')}</div>
      </div>
      <div class="metrics">${metrics}
        <form class="inline-form" data-submit="addMetric" data-front="${f.id}">
          <input class="input sm" name="label" placeholder="+ indicador (ex: reuniões)" maxlength="40" style="width:190px" required>
        </form>
      </div>
      ${projects}
      <form class="inline-form card-foot" data-submit="addProject" data-front="${f.id}">
        <input class="input" name="name" placeholder="Novo projeto ou próximo passo" required maxlength="120">
        <button class="btn" type="submit">Adicionar</button>
      </form>
    </section>`;
  };

  return `
  ${pillarHeader('carreira', 'Cada frente da carreira com seu plano. Toque em "+10%" conforme for avançando.')}

  <div class="stats">
    ${statCard({ label: 'Progresso geral', value: `${Calc.careerAvg()}%`, foot: footText(`${all.length} ${all.length === 1 ? 'projeto' : 'projetos'} em ${S.career.length} ${S.career.length === 1 ? 'frente' : 'frentes'}`), dark: true })}
    ${statCard({ label: 'Em andamento', value: all.filter(p => p.progress < 100).length, unit: 'projetos' })}
    ${statCard({ label: 'Concluídos', value: all.filter(p => p.progress >= 100).length, unit: 'projetos' })}
    ${statCard({ label: 'Avançaram na semana', value: recent, unit: recent === 1 ? 'projeto' : 'projetos', foot: footText('últimos 7 dias') })}
  </div>

  ${S.career.map(front).join('')}

  ${card({
    title: 'Nova frente',
    sub: 'Ex: trabalho principal, negócio próprio, conteúdo, transição de carreira',
    body: `<form class="inline-form" data-submit="addFront">
      <input class="input" name="name" placeholder="Nome da frente" required maxlength="60">
      <input class="input" name="desc" placeholder="Descrição (opcional)" maxlength="100">
      <button class="btn" type="submit">${icon('plus')} Criar</button>
    </form>`,
  })}`;
};

/* ---------------- Configurações ---------------- */
Views.config = () => {
  const S = Store.state, s = S.settings;
  const setting = (key, label, type = 'number', extra = '') => `
    <div class="field"><label for="set-${key}">${esc(label)}</label>
      <input id="set-${key}" class="input" type="${type}" value="${esc(s[key])}" data-change="setting" data-key="${key}" data-type="${type}" data-k="set-${key}" ${extra}></div>`;

  const listEditor = (items, list, submit, ph) => `
    <div class="list-editor">${items.length ? items.map(it =>
      `<div class="row"><div class="grow">${esc(it.name)}</div>${removeBtn(`data-list="${list}" data-id="${esc(it.id)}"`)}</div>`).join('') : '<div class="empty">Lista vazia.</div>'}</div>
    <form class="inline-form card-foot" data-submit="${submit}">
      <input class="input" name="name" placeholder="${esc(ph)}" required maxlength="80">
      <button class="btn" type="submit">Adicionar</button>
    </form>`;

  return `
  ${pageHeader({ eyebrow: 'Configurações', title: 'Ajuste o painel à sua rotina', desc: 'Metas, listas e backup dos seus dados.' })}

  <div class="grid g-2">
    ${card({
      title: 'Perfil e metas',
      sub: 'Alterações salvas automaticamente',
      body: `<div class="fields">
        ${setting('name', 'Seu nome', 'text', 'maxlength="40" placeholder="Como quer ser chamado"')}
        ${setting('habitName', 'Hábito diário (Saúde)', 'text', 'maxlength="40"')}
        ${setting('trainGoal', 'Treinos por semana', 'number', 'min="1" max="7"')}
        ${setting('sleepGoal', 'Horas de sono por noite', 'number', 'min="4" max="12" step="0.5"')}
        ${setting('pagesGoal', 'Páginas por dia', 'number', 'min="1" max="500"')}
      </div>`,
    })}
    ${card({
      title: 'Rituais de sono',
      sub: 'Aparecem como checklist diário no pilar Sono',
      body: listEditor(S.rituals, 'rituals', 'addRitual', 'Novo ritual (ex: chá antes de dormir)'),
    })}
  </div>

  <div class="grid g-2">
    ${card({
      title: 'Categorias de gastos',
      sub: 'Usadas no pilar Finanças',
      body: listEditor(S.finance.categories.map(c => ({ id: c, name: c })), 'categories', 'addCategory', 'Nova categoria (ex: Saúde)'),
    })}
    ${card({
      title: 'Seus dados',
      sub: 'Ficam salvos apenas neste navegador',
      body: `<div style="display:flex;flex-direction:column;gap:10px;align-items:flex-start">
          <button class="btn" data-action="exportData">${icon('download')} Exportar backup (.json)</button>
          <label class="btn ghost" style="cursor:pointer">${icon('upload')} Importar backup
            <input type="file" accept="application/json,.json" data-change="importData" style="display:none"></label>
          <button class="btn ghost" data-action="loadSample">Carregar dados de exemplo</button>
          <button class="btn danger" data-action="clearAll">Apagar tudo e começar do zero</button>
        </div>
        <div class="tip">Faça um backup de vez em quando: limpar os dados do navegador apaga o painel. Para usar no celular e no computador ao mesmo tempo, o próximo passo seria sincronizar com um banco de dados online.</div>`,
    })}
  </div>`;
};
