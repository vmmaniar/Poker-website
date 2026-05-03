// ─── State ───────────────────────────────────────────────────────────────────
const COLORS = [
  '#f0b90b','#22c55e','#3b82f6','#a855f7','#ef4444',
  '#f97316','#06b6d4','#ec4899','#84cc16','#8b5cf6'
];

let state = load();
let selectedColor = COLORS[0];
let pnlChart = null;
let monthlyChart = null;
let winRateChart = null;
let profileChart = null;
let activeTimer = null;

function load() {
  try {
    const raw = localStorage.getItem('pokerNight');
    const data = raw ? JSON.parse(raw) : { players: [], sessions: [], activeSession: null };
    if (!('activeSession' in data)) data.activeSession = null;
    return data;
  } catch { return { players: [], sessions: [], activeSession: null }; }
}

function save() {
  localStorage.setItem('pokerNight', JSON.stringify(state));
}

// ─── Navigation ──────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
    if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
    renderPage(page);
  });
});

document.getElementById('quickLogBtn').addEventListener('click', () => {
  document.querySelector('[data-page="session"]').click();
});

function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  else if (page === 'session') renderSessionForm();
  else if (page === 'players') renderPlayersPage();
  else if (page === 'history') renderHistory();
  renderSidebarStats();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n) {
  const abs = Math.abs(n);
  const str = abs % 1 === 0 ? abs.toString() : abs.toFixed(2);
  return (n >= 0 ? '+' : '−') + '$' + str;
}

function fmtAbs(n) {
  const abs = Math.abs(n);
  return '$' + (abs % 1 === 0 ? abs.toString() : abs.toFixed(2));
}

function colorClass(n) {
  if (n > 0) return 'positive';
  if (n < 0) return 'negative';
  return 'neutral';
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function playerById(id) {
  return state.players.find(p => p.id === id);
}

function playerStats(playerId) {
  const sessions = state.sessions
    .filter(s => s.results.some(r => r.playerId === playerId))
    .sort((a, b) => a.date.localeCompare(b.date));
  let total = 0, wins = 0, losses = 0, best = -Infinity, worst = Infinity;
  let tempStreak = 0, tempSign = null, bestWinStreak = 0;
  sessions.forEach(s => {
    const r = s.results.find(r => r.playerId === playerId);
    if (!r) return;
    total += r.amount;
    if (r.amount > 0) wins++;
    else if (r.amount < 0) losses++;
    if (r.amount > best) best = r.amount;
    if (r.amount < worst) worst = r.amount;
    const sign = r.amount > 0 ? 'W' : r.amount < 0 ? 'L' : 'E';
    if (sign === tempSign) tempStreak++;
    else { tempStreak = 1; tempSign = sign; }
    if (sign === 'W' && tempStreak > bestWinStreak) bestWinStreak = tempStreak;
  });
  return {
    total, sessions: sessions.length, wins, losses,
    winRate: sessions.length ? Math.round((wins / sessions.length) * 100) : 0,
    best: best === -Infinity ? 0 : best,
    worst: worst === Infinity ? 0 : worst,
    avg: sessions.length ? total / sessions.length : 0,
    currentStreak: tempStreak,
    currentStreakSign: tempSign,
    bestWinStreak
  };
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dot(color, size = 10) {
  return `<span class="result-dot" style="width:${size}px;height:${size}px;background:${color};border-radius:50%;display:inline-block;flex-shrink:0;"></span>`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ─── Modal ────────────────────────────────────────────────────────────────────
let modalResolve;
function confirm(title, body) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').textContent = body;
  document.getElementById('modal').classList.remove('hidden');
  return new Promise(res => { modalResolve = res; });
}

document.getElementById('modalCancel').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
  if (modalResolve) modalResolve(false);
});

document.getElementById('modalConfirm').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
  if (modalResolve) modalResolve(true);
});

// ─── Sidebar Stats ────────────────────────────────────────────────────────────
function renderSidebarStats() {
  const el = document.getElementById('sidebarStats');
  el.innerHTML = `
    ${state.sessions.length} session${state.sessions.length !== 1 ? 's' : ''} logged<br>
    ${state.players.length} player${state.players.length !== 1 ? 's' : ''}
  `;
}

// ─── Mobile Menu (sidebar hidden in new design, kept for compatibility) ───────
const _menuToggle = document.getElementById('menuToggle');
if (_menuToggle) _menuToggle.addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.toggle('open');
  document.querySelector('.sidebar-overlay')?.classList.toggle('active');
});
document.querySelector('.sidebar-overlay')?.addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('active');
});

// ─── Active Session ───────────────────────────────────────────────────────────
function getElapsedTime(startTime) {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getTotalBuyin(playerId) {
  if (!state.activeSession) return 0;
  const initial = (state.activeSession.buyins || {})[playerId] || 0;
  const rebuyTotal = (state.activeSession.rebuys || [])
    .filter(r => r.playerId === playerId)
    .reduce((s, r) => s + r.amount, 0);
  return initial + rebuyTotal;
}

function renderActiveBanner() {
  const banner = document.getElementById('liveSessionBanner');
  const startLiveBtn = document.getElementById('startLiveBtn');
  if (!banner) return;

  if (!state.activeSession) {
    banner.classList.add('hidden');
    if (startLiveBtn) startLiveBtn.style.display = '';
    if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
    return;
  }

  banner.classList.remove('hidden');
  if (startLiveBtn) startLiveBtn.style.display = 'none';

  const timerEl = document.getElementById('liveTimer');
  const notesEl = document.getElementById('liveSessNotes');
  const countEl = document.getElementById('liveRebuyCount');

  if (notesEl) notesEl.textContent = state.activeSession.notes || '';
  if (countEl) {
    const n = (state.activeSession.rebuys || []).length;
    countEl.textContent = n ? `${n} re-buy${n !== 1 ? 's' : ''}` : '';
    countEl.style.display = n ? '' : 'none';
  }

  if (activeTimer) clearInterval(activeTimer);
  const tick = () => { if (timerEl && state.activeSession) timerEl.textContent = getElapsedTime(state.activeSession.startTime); };
  tick();
  activeTimer = setInterval(tick, 1000);
}

function openStartSessionModal() {
  if (!state.players.length) { toast('Add players first'); return; }
  document.getElementById('liveSessionDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('liveSessionNotes').value = '';

  const list = document.getElementById('liveBuyinList');
  list.innerHTML = state.players.map(p => `
    <div class="result-row">
      <span class="result-dot" style="background:${p.color}"></span>
      <span class="result-name">${p.name}</span>
      <input type="number" class="result-input live-buyin-input" data-player="${p.id}" placeholder="0" step="0.5" min="0" />
    </div>
  `).join('');

  document.getElementById('startSessionModal').classList.remove('hidden');
}

document.getElementById('startLiveBtn').addEventListener('click', () => {
  if (state.activeSession) { toast('A session is already active'); return; }
  openStartSessionModal();
});

document.getElementById('startSessionCancel').addEventListener('click', () => {
  document.getElementById('startSessionModal').classList.add('hidden');
});

document.getElementById('startSessionConfirm').addEventListener('click', () => {
  const date = document.getElementById('liveSessionDate').value;
  if (!date) { toast('Please select a date'); return; }

  const notes = document.getElementById('liveSessionNotes').value.trim();
  const buyins = {};
  document.querySelectorAll('.live-buyin-input').forEach(inp => {
    const v = parseFloat(inp.value) || 0;
    if (v > 0) buyins[inp.dataset.player] = v;
  });

  state.activeSession = { startTime: Date.now(), date, notes, buyins, rebuys: [] };
  save();
  document.getElementById('startSessionModal').classList.add('hidden');
  renderDashboard();
  toast('Live session started! ♠');
});

// ─── Re-buy ───────────────────────────────────────────────────────────────────
let rebuySelectedPlayerId = null;

function openRebuyModal() {
  if (!state.activeSession) return;
  rebuySelectedPlayerId = null;

  const list = document.getElementById('rebuyPlayerList');
  list.innerHTML = state.players.map(p => {
    const total = getTotalBuyin(p.id);
    return `
      <button class="rebuy-player-btn" data-id="${p.id}">
        <div class="player-dot" style="background:${p.color};width:44px;height:44px;font-size:1rem">${initials(p.name)}</div>
        <div class="rebuy-player-info">
          <div class="rebuy-player-name">${p.name}</div>
          <div class="rebuy-player-total">In for ${total > 0 ? fmtAbs(total) : '$0'}</div>
        </div>
      </button>
    `;
  }).join('');

  const amtRow = document.getElementById('rebuyAmountRow');
  const confirmBtn = document.getElementById('rebuyConfirm');
  amtRow.classList.add('hidden');
  confirmBtn.classList.add('hidden');
  document.getElementById('rebuyAmount').value = '';

  list.querySelectorAll('.rebuy-player-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      rebuySelectedPlayerId = btn.dataset.id;
      const p = playerById(rebuySelectedPlayerId);
      list.querySelectorAll('.rebuy-player-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('rebuySelectedPlayer').innerHTML = `
        <div class="player-dot" style="background:${p.color};width:28px;height:28px;font-size:0.75rem">${initials(p.name)}</div>
        <span>${p.name}</span>
      `;
      amtRow.classList.remove('hidden');
      confirmBtn.classList.remove('hidden');
      document.getElementById('rebuyAmount').focus();
    });
  });

  document.getElementById('rebuyModal').classList.remove('hidden');
}

document.getElementById('rebuyBtn').addEventListener('click', openRebuyModal);

document.getElementById('rebuyCancel').addEventListener('click', () => {
  document.getElementById('rebuyModal').classList.add('hidden');
});

document.getElementById('rebuyConfirm').addEventListener('click', () => {
  if (!rebuySelectedPlayerId || !state.activeSession) return;
  const amount = parseFloat(document.getElementById('rebuyAmount').value) || 0;
  if (amount <= 0) { toast('Enter a valid amount'); return; }

  state.activeSession.rebuys.push({ playerId: rebuySelectedPlayerId, amount, time: Date.now() });
  save();

  const p = playerById(rebuySelectedPlayerId);
  document.getElementById('rebuyModal').classList.add('hidden');
  renderActiveBanner();
  toast(`Re-buy added for ${p?.name}: ${fmtAbs(amount)}`);
});

document.getElementById('rebuyAmount').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('rebuyConfirm').click();
});

// ─── End Session ──────────────────────────────────────────────────────────────
function openEndSessionModal() {
  if (!state.activeSession) return;

  const cashoutList = document.getElementById('cashoutList');
  cashoutList.innerHTML = state.players.map(p => {
    const buyin = getTotalBuyin(p.id);
    return `
      <div class="result-row">
        <span class="result-dot" style="background:${p.color}"></span>
        <div class="cashout-player-info">
          <span class="result-name">${p.name}</span>
          <span class="cashout-buyin">Buy-in: ${buyin > 0 ? fmtAbs(buyin) : '$0'}</span>
        </div>
        <input type="number" class="result-input cashout-input"
               data-player="${p.id}" data-buyin="${buyin}"
               placeholder="Cash out" step="0.5" min="0" />
      </div>
    `;
  }).join('');

  cashoutList.querySelectorAll('.cashout-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value) || 0;
      const b = parseFloat(inp.dataset.buyin) || 0;
      inp.classList.toggle('win', v > b);
      inp.classList.toggle('loss', v < b && v > 0);
      updateCashoutBalance();
    });
  });

  updateCashoutBalance();
  document.getElementById('endSessionModal').classList.remove('hidden');
}

function updateCashoutBalance() {
  const inputs = document.querySelectorAll('.cashout-input');
  const totalCashout = [...inputs].reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
  const totalBuyin = [...inputs].reduce((s, el) => s + (parseFloat(el.dataset.buyin) || 0), 0);
  const diff = Math.round((totalCashout - totalBuyin) * 100) / 100;
  const row = document.getElementById('cashoutBalance');
  if (Math.abs(diff) < 0.01) {
    row.innerHTML = totalBuyin > 0
      ? `<span class="balance-ok">✓ Balanced — total pot ${fmtAbs(totalBuyin)}</span>`
      : `<span class="balance-neutral">Enter cash-out amounts above</span>`;
  } else if (diff > 0) {
    row.innerHTML = `<span class="balance-bad">⚠ Cash outs exceed buy-ins by ${fmtAbs(diff)}</span>`;
  } else {
    row.innerHTML = `<span class="balance-bad">⚠ Cash outs short by ${fmtAbs(Math.abs(diff))}</span>`;
  }
}

document.getElementById('endSessionBtn').addEventListener('click', openEndSessionModal);

document.getElementById('endSessionCancel').addEventListener('click', () => {
  document.getElementById('endSessionModal').classList.add('hidden');
});

document.getElementById('endSessionSave').addEventListener('click', () => {
  if (!state.activeSession) return;
  const inputs = document.querySelectorAll('.cashout-input');

  const results = [...inputs].map(el => ({
    playerId: el.dataset.player,
    amount: Math.round(((parseFloat(el.value) || 0) - (parseFloat(el.dataset.buyin) || 0)) * 100) / 100
  })).filter(r => r.amount !== 0);

  if (!results.length) { toast('Enter at least one cash-out amount'); return; }

  const total = results.reduce((s, r) => s + r.amount, 0);
  if (Math.abs(total) > 0.5) {
    toast(`Results don't balance (off by ${fmt(total)})`);
    return;
  }

  const session = {
    id: Date.now().toString(),
    date: state.activeSession.date,
    notes: state.activeSession.notes,
    results
  };

  state.sessions.push(session);
  state.activeSession = null;
  save();

  if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
  document.getElementById('endSessionModal').classList.add('hidden');
  renderDashboard();
  renderSidebarStats();
  toast('Session saved! ♠');
});

document.getElementById('discardSessionBtn').addEventListener('click', async () => {
  const ok = await confirm('Discard live session?', 'All buy-in and re-buy data for this session will be lost.');
  if (!ok) return;
  state.activeSession = null;
  save();
  if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
  renderDashboard();
  toast('Session discarded');
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
function renderDashboard() {
  renderActiveBanner();
  renderStatCards();
  renderLeaderboard();
  renderPnlChart();
  renderMonthlyChart();
  renderWinRateChart();
  renderH2H();
  renderPlayerInsights();
  renderRecentSessions();
}

function renderStatCards() {
  const grid = document.getElementById('statGrid');
  if (!state.sessions.length) {
    grid.innerHTML = '';
    return;
  }

  const totalSessions = state.sessions.length;
  const allAmounts = state.sessions.flatMap(s => s.results.map(r => r.amount));
  const totalPot = allAmounts.filter(a => a > 0).reduce((s, a) => s + a, 0);

  let bigWin = { amount: -Infinity, player: null };
  let bigLoss = { amount: Infinity, player: null };
  state.sessions.forEach(s => {
    s.results.forEach(r => {
      if (r.amount > bigWin.amount) { bigWin = { amount: r.amount, player: r.playerId }; }
      if (r.amount < bigLoss.amount) { bigLoss = { amount: r.amount, player: r.playerId }; }
    });
  });

  const bigWinP = playerById(bigWin.player);
  const bigLossP = playerById(bigLoss.player);

  const sorted = [...state.players].sort((a, b) =>
    playerStats(b.id).total - playerStats(a.id).total
  );
  const leader = sorted[0];

  const cards = [
    { label: 'Total Sessions', value: totalSessions, sub: 'games played', color: '#c9a227' },
    { label: 'Total Pot Moved', value: fmtAbs(totalPot), sub: 'across all sessions', color: '#3b82f6' },
    {
      label: 'Biggest Win',
      value: bigWin.amount > -Infinity ? fmt(bigWin.amount) : '—',
      sub: bigWinP ? bigWinP.name : '',
      color: '#22c55e'
    },
    {
      label: 'Biggest Loss',
      value: bigLoss.amount < Infinity ? fmt(bigLoss.amount) : '—',
      sub: bigLossP ? bigLossP.name : '',
      color: '#ef4444'
    },
    {
      label: 'Overall Leader',
      value: leader ? leader.name : '—',
      sub: leader ? fmt(playerStats(leader.id).total) : '',
      color: leader?.color || '#c9a227'
    }
  ];

  grid.innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-label">${c.label}</div>
      <div class="stat-value ${typeof c.value === 'string' && c.value.startsWith('+') ? 'positive' : typeof c.value === 'string' && c.value.startsWith('−') ? 'negative' : ''}" style="color:${c.color}">${c.value}</div>
      ${c.sub ? `<div class="stat-sub">${c.sub}</div>` : ''}
    </div>
  `).join('');
}

function renderLeaderboard() {
  const el = document.getElementById('leaderboard');
  if (!state.players.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">♠</div><p>No players yet. Add players to get started.</p></div>';
    return;
  }

  const sorted = [...state.players]
    .map(p => ({ ...p, stats: playerStats(p.id) }))
    .sort((a, b) => b.stats.total - a.stats.total);

  el.innerHTML = sorted.map((p, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'other';
    const trend = p.stats.total >= 0 ? '↗' : '↘';
    const trendColor = p.stats.total >= 0 ? 'var(--green)' : 'var(--red)';
    return `
    <div class="lb-row">
      <div class="lb-rank-badge ${rankClass}">${i + 1}</div>
      <div class="player-dot" style="background:${p.color}">${initials(p.name)}</div>
      <div class="lb-info">
        <div class="lb-name player-link" data-id="${p.id}">${p.name}</div>
        <div class="lb-sessions">${p.stats.sessions} sessions · ${p.stats.winRate}% win rate</div>
      </div>
      <div class="lb-right">
        <span class="lb-amount ${colorClass(p.stats.total)}">${fmt(p.stats.total)}</span>
        <span class="lb-trend" style="color:${trendColor}">${trend}</span>
      </div>
    </div>
    `;
  }).join('');

  el.querySelectorAll('.player-link').forEach(link => {
    link.addEventListener('click', () => showProfile(link.dataset.id));
  });
}

function renderPnlChart() {
  const canvas = document.getElementById('pnlChart');
  if (!state.sessions.length || !state.players.length) {
    canvas.style.display = 'none';
    return;
  }
  canvas.style.display = '';

  const sorted = [...state.sessions].sort((a, b) => a.date.localeCompare(b.date));
  const labels = sorted.map(s => formatDate(s.date));

  const datasets = state.players.map(p => {
    let running = 0;
    const data = sorted.map(s => {
      const r = s.results.find(r => r.playerId === p.id);
      running += r ? r.amount : 0;
      return running;
    });
    return {
      label: p.name,
      data,
      borderColor: p.color,
      backgroundColor: p.color + '18',
      tension: 0.35,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5,
    };
  });

  if (pnlChart) pnlChart.destroy();

  pnlChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: 'rgba(26,26,26,0.5)', font: { size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          backgroundColor: '#fdfaef',
          borderColor: 'rgba(0,0,0,0.12)',
          borderWidth: 1,
          titleColor: '#1a1a1a',
          bodyColor: 'rgba(26,26,26,0.6)',
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(26,26,26,0.4)', font: { size: 10 }, maxTicksLimit: 8 },
          grid: { color: 'rgba(0,0,0,0.07)' }
        },
        y: {
          ticks: { color: 'rgba(26,26,26,0.4)', font: { size: 10 }, callback: v => '$' + v },
          grid: { color: 'rgba(0,0,0,0.07)' }
        }
      }
    }
  });
}

function renderMonthlyChart() {
  const canvas = document.getElementById('monthlyChart');
  if (!state.sessions.length || !state.players.length) {
    canvas.style.display = 'none';
    return;
  }
  canvas.style.display = '';

  const months = [...new Set(state.sessions.map(s => s.date.slice(0, 7)))].sort();

  const datasets = state.players.map(p => {
    const data = months.map(m =>
      state.sessions
        .filter(s => s.date.startsWith(m))
        .reduce((sum, s) => {
          const r = s.results.find(r => r.playerId === p.id);
          return sum + (r ? r.amount : 0);
        }, 0)
    );
    return {
      label: p.name,
      data,
      backgroundColor: p.color + 'cc',
      borderColor: p.color,
      borderWidth: 1,
      borderRadius: 4,
    };
  });

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months.map(m => {
        const [y, mo] = m.split('-');
        return new Date(+y, +mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      datasets
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: 'rgba(26,26,26,0.5)', font: { size: 11 }, boxWidth: 12 } },
        tooltip: {
          backgroundColor: '#fdfaef',
          borderColor: 'rgba(0,0,0,0.12)',
          borderWidth: 1,
          titleColor: '#1a1a1a',
          bodyColor: 'rgba(26,26,26,0.6)',
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` }
        }
      },
      scales: {
        x: { ticks: { color: 'rgba(26,26,26,0.4)', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.07)' } },
        y: {
          ticks: { color: 'rgba(26,26,26,0.4)', font: { size: 10 }, callback: v => '$' + v },
          grid: { color: 'rgba(0,0,0,0.07)' }
        }
      }
    }
  });
}

function renderWinRateChart() {
  const canvas = document.getElementById('winRateChart');
  if (!state.sessions.length || !state.players.length) {
    canvas.style.display = 'none';
    return;
  }
  canvas.style.display = '';

  const sorted = [...state.sessions].sort((a, b) => a.date.localeCompare(b.date));

  const datasets = state.players
    .filter(p => state.sessions.some(s => s.results.some(r => r.playerId === p.id)))
    .map(p => {
      const results = sorted
        .filter(s => s.results.some(r => r.playerId === p.id))
        .map(s => s.results.find(r => r.playerId === p.id).amount);

      const data = results.map((_, i) => {
        const window = results.slice(Math.max(0, i - 4), i + 1);
        const wins = window.filter(a => a > 0).length;
        return Math.round((wins / window.length) * 100);
      });

      return {
        label: p.name,
        data,
        borderColor: p.color,
        backgroundColor: p.color + '18',
        tension: 0.35,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      };
    });

  const maxLen = Math.max(...datasets.map(d => d.data.length), 1);
  const labels = Array.from({ length: maxLen }, (_, i) => `#${i + 1}`);

  if (winRateChart) winRateChart.destroy();

  winRateChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: 'rgba(26,26,26,0.5)', font: { size: 11 }, boxWidth: 12 } },
        tooltip: {
          backgroundColor: '#fdfaef',
          borderColor: 'rgba(0,0,0,0.12)',
          borderWidth: 1,
          titleColor: '#1a1a1a',
          bodyColor: 'rgba(26,26,26,0.6)',
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%` }
        }
      },
      scales: {
        x: { ticks: { color: 'rgba(26,26,26,0.4)', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.07)' } },
        y: {
          min: 0, max: 100,
          ticks: { color: 'rgba(26,26,26,0.4)', font: { size: 10 }, callback: v => v + '%' },
          grid: { color: 'rgba(0,0,0,0.07)' }
        }
      }
    }
  });
}

function renderH2H() {
  const el = document.getElementById('h2hTable');
  const players = state.players;
  if (players.length < 2) {
    el.innerHTML = '<div class="empty-state"><p>Need at least 2 players to show head-to-head stats.</p></div>';
    return;
  }

  let html = '<table class="h2h-table"><thead><tr><th></th>';
  players.forEach(p => {
    html += `<th><div class="player-dot" style="background:${p.color};width:24px;height:24px;font-size:0.65rem;margin:0 auto">${initials(p.name)}</div><div class="h2h-col-label">${p.name.split(' ')[0]}</div></th>`;
  });
  html += '</tr></thead><tbody>';

  players.forEach(a => {
    html += `<tr><td class="h2h-row-label"><div class="player-dot" style="background:${a.color};width:24px;height:24px;font-size:0.65rem">${initials(a.name)}</div><span>${a.name.split(' ')[0]}</span></td>`;
    players.forEach(b => {
      if (a.id === b.id) {
        html += `<td class="h2h-cell h2h-self">—</td>`;
      } else {
        const shared = state.sessions.filter(s =>
          s.results.some(r => r.playerId === a.id) &&
          s.results.some(r => r.playerId === b.id)
        );
        if (!shared.length) {
          html += `<td class="h2h-cell h2h-no-data">—</td>`;
        } else {
          const wins = shared.filter(s => {
            const r = s.results.find(r => r.playerId === a.id);
            return r && r.amount > 0;
          }).length;
          const pct = Math.round((wins / shared.length) * 100);
          const cls = pct > 50 ? 'h2h-win' : pct < 50 ? 'h2h-lose' : 'h2h-even';
          html += `<td class="h2h-cell ${cls}"><div class="h2h-pct">${pct}%</div><div class="h2h-games">${shared.length}g</div></td>`;
        }
      }
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  el.innerHTML = html;
}

function renderPlayerInsights() {
  const el = document.getElementById('playerInsights');
  if (!state.players.length) {
    el.innerHTML = '<div class="empty-state"><p>No player data yet.</p></div>';
    return;
  }

  el.innerHTML = state.players.map(p => {
    const s = playerStats(p.id);
    const streakColor = s.currentStreakSign === 'W' ? 'var(--green)' : s.currentStreakSign === 'L' ? 'var(--red)' : 'var(--text-muted)';
    const streakLabel = s.currentStreak && s.currentStreakSign ? `${s.currentStreak}${s.currentStreakSign}` : '—';
    return `
      <div class="insight-card" style="border-left-color:${p.color}">
        <div class="insight-name">
          <div class="player-dot" style="background:${p.color};width:24px;height:24px;font-size:0.7rem">${initials(p.name)}</div>
          <span class="player-link" data-id="${p.id}">${p.name}</span>
        </div>
        <div class="insight-stats">
          <div class="insight-stat">
            <span class="insight-stat-label">Total P&amp;L</span>
            <span class="insight-stat-value ${colorClass(s.total)}">${fmt(s.total)}</span>
          </div>
          <div class="insight-stat">
            <span class="insight-stat-label">Win Rate</span>
            <span class="insight-stat-value">${s.winRate}%</span>
          </div>
          <div class="insight-stat">
            <span class="insight-stat-label">Best Session</span>
            <span class="insight-stat-value positive">${s.sessions ? fmt(s.best) : '—'}</span>
          </div>
          <div class="insight-stat">
            <span class="insight-stat-label">Worst Session</span>
            <span class="insight-stat-value ${s.worst < 0 ? 'negative' : 'neutral'}">${s.sessions ? fmt(s.worst) : '—'}</span>
          </div>
          <div class="insight-stat">
            <span class="insight-stat-label">Avg / Session</span>
            <span class="insight-stat-value ${colorClass(s.avg)}">${s.sessions ? fmt(Math.round(s.avg)) : '—'}</span>
          </div>
          <div class="insight-stat">
            <span class="insight-stat-label">Sessions</span>
            <span class="insight-stat-value">${s.sessions}</span>
          </div>
          <div class="insight-stat">
            <span class="insight-stat-label">Current Streak</span>
            <span class="insight-stat-value" style="color:${streakColor}">${streakLabel}</span>
          </div>
          <div class="insight-stat">
            <span class="insight-stat-label">Best Win Streak</span>
            <span class="insight-stat-value positive">${s.bestWinStreak ? s.bestWinStreak + 'W' : '—'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.player-link').forEach(link => {
    link.addEventListener('click', () => showProfile(link.dataset.id));
  });
}

function renderRecentSessions() {
  const el = document.getElementById('recentSessions');
  if (!state.sessions.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🃏</div><p>No sessions logged yet. Click "Log Session" to add your first game!</p></div>';
    return;
  }

  const recent = [...state.sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  el.innerHTML = recent.map(s => `
    <div class="session-row">
      <span class="session-date">${formatDate(s.date)}</span>
      <div class="session-players">
        ${s.results.map(r => {
          const p = playerById(r.playerId);
          if (!p) return '';
          return `
            <span class="session-chip">
              <span class="chip-dot" style="background:${p.color}"></span>
              ${p.name} <span class="${colorClass(r.amount)}">${fmt(r.amount)}</span>
            </span>
          `;
        }).join('')}
      </div>
      ${s.notes ? `<span class="session-note" title="${s.notes}">${s.notes}</span>` : ''}
      <button class="session-delete" data-id="${s.id}" title="Delete session">✕</button>
    </div>
  `).join('');

  el.querySelectorAll('.session-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm('Delete session?', 'This will permanently remove this session and all its results.');
      if (!ok) return;
      state.sessions = state.sessions.filter(s => s.id !== btn.dataset.id);
      save();
      renderDashboard();
      toast('Session deleted');
    });
  });
}

// ─── Player Profile Modal ─────────────────────────────────────────────────────
function showProfile(playerId) {
  const player = playerById(playerId);
  if (!player) return;
  const s = playerStats(playerId);
  const sessions = state.sessions
    .filter(sess => sess.results.some(r => r.playerId === playerId))
    .sort((a, b) => b.date.localeCompare(a.date));

  const streakColor = s.currentStreakSign === 'W' ? 'var(--green)' : s.currentStreakSign === 'L' ? 'var(--red)' : 'var(--text-muted)';
  const streakLabel = s.currentStreak && s.currentStreakSign ? `${s.currentStreak}${s.currentStreakSign}` : '—';

  document.getElementById('profileContent').innerHTML = `
    <div class="profile-header">
      <div class="player-dot" style="background:${player.color};width:48px;height:48px;font-size:1.1rem">${initials(player.name)}</div>
      <div>
        <div class="profile-name">${player.name}</div>
        <div class="profile-sub">${s.sessions} session${s.sessions !== 1 ? 's' : ''} played</div>
      </div>
    </div>
    <div class="profile-stats">
      <div class="insight-stat"><span class="insight-stat-label">Total P&amp;L</span><span class="insight-stat-value ${colorClass(s.total)}">${fmt(s.total)}</span></div>
      <div class="insight-stat"><span class="insight-stat-label">Win Rate</span><span class="insight-stat-value">${s.winRate}%</span></div>
      <div class="insight-stat"><span class="insight-stat-label">Best Session</span><span class="insight-stat-value positive">${s.sessions ? fmt(s.best) : '—'}</span></div>
      <div class="insight-stat"><span class="insight-stat-label">Worst Session</span><span class="insight-stat-value ${s.worst < 0 ? 'negative' : 'neutral'}">${s.sessions ? fmt(s.worst) : '—'}</span></div>
      <div class="insight-stat"><span class="insight-stat-label">Avg / Session</span><span class="insight-stat-value ${colorClass(s.avg)}">${s.sessions ? fmt(Math.round(s.avg)) : '—'}</span></div>
      <div class="insight-stat"><span class="insight-stat-label">Wins / Losses</span><span class="insight-stat-value">${s.wins}W · ${s.losses}L</span></div>
      <div class="insight-stat"><span class="insight-stat-label">Current Streak</span><span class="insight-stat-value" style="color:${streakColor}">${streakLabel}</span></div>
      <div class="insight-stat"><span class="insight-stat-label">Best Win Streak</span><span class="insight-stat-value positive">${s.bestWinStreak ? s.bestWinStreak + 'W' : '—'}</span></div>
    </div>
    ${sessions.length ? `
    <div class="profile-section-label">Recent Sessions</div>
    <div class="profile-sessions">
      ${sessions.slice(0, 8).map(sess => {
        const r = sess.results.find(r => r.playerId === playerId);
        return `<div class="profile-session-row">
          <span class="session-date">${formatDate(sess.date)}</span>
          ${sess.notes ? `<span class="profile-session-note">${sess.notes}</span>` : '<span style="flex:1"></span>'}
          <span class="lb-amount ${colorClass(r.amount)}">${fmt(r.amount)}</span>
        </div>`;
      }).join('')}
    </div>` : ''}
  `;

  const canvas = document.getElementById('profileChart');
  const sessionsAsc = [...sessions].reverse();
  let running = 0;
  const chartData = sessionsAsc.map(sess => {
    const r = sess.results.find(r => r.playerId === playerId);
    running += r ? r.amount : 0;
    return running;
  });

  if (profileChart) { profileChart.destroy(); profileChart = null; }
  if (chartData.length > 1) {
    canvas.style.display = '';
    profileChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: sessionsAsc.map(s => formatDate(s.date)),
        datasets: [{
          data: chartData,
          borderColor: player.color,
          backgroundColor: player.color + '20',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fdfaef',
            borderColor: 'rgba(0,0,0,0.12)',
            borderWidth: 1,
            titleColor: '#1a1a1a',
            bodyColor: 'rgba(26,26,26,0.6)',
            callbacks: { label: ctx => ` P&L: ${fmt(ctx.parsed.y)}` }
          }
        },
        scales: {
          x: { ticks: { color: 'rgba(26,26,26,0.4)', font: { size: 9 }, maxTicksLimit: 6 }, grid: { color: 'rgba(0,0,0,0.07)' } },
          y: { ticks: { color: 'rgba(26,26,26,0.4)', font: { size: 9 }, callback: v => '$' + v }, grid: { color: 'rgba(0,0,0,0.07)' } }
        }
      }
    });
  } else {
    canvas.style.display = 'none';
  }

  document.getElementById('profileModal').classList.remove('hidden');
}

function closeProfile() {
  document.getElementById('profileModal').classList.add('hidden');
  if (profileChart) { profileChart.destroy(); profileChart = null; }
}

document.getElementById('profileClose').addEventListener('click', closeProfile);

document.getElementById('profileModal').addEventListener('click', e => {
  if (e.target === document.getElementById('profileModal')) closeProfile();
});

// ─── Session Form ─────────────────────────────────────────────────────────────
function renderSessionForm() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sessionDate').value = today;
  document.getElementById('sessionNotes').value = '';

  const list = document.getElementById('sessionResults');
  if (!state.players.length) {
    list.innerHTML = '<div class="empty-state"><p>No players added yet. Go to Players to add some first.</p></div>';
    document.getElementById('balanceRow').innerHTML = '';
    return;
  }

  list.innerHTML = state.players.map(p => `
    <div class="result-row">
      <span class="result-dot" style="background:${p.color}"></span>
      <span class="result-name">${p.name}</span>
      <input
        type="number"
        class="result-input"
        data-player="${p.id}"
        placeholder="0"
        step="0.5"
      />
    </div>
  `).join('');

  list.querySelectorAll('.result-input').forEach(input => {
    input.addEventListener('input', () => {
      const v = parseFloat(input.value) || 0;
      input.classList.toggle('win', v > 0);
      input.classList.toggle('loss', v < 0);
      updateBalance();
    });
  });

  updateBalance();
}

function updateBalance() {
  const inputs = document.querySelectorAll('.result-input');
  const total = [...inputs].reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
  const row = document.getElementById('balanceRow');
  if (!inputs.length) { row.innerHTML = ''; return; }
  const rounded = Math.round(total * 100) / 100;
  if (Math.abs(rounded) < 0.01) {
    row.innerHTML = '<span class="balance-ok">✓ Balanced — results sum to $0</span>';
  } else {
    row.innerHTML = `<span class="balance-bad">⚠ Not balanced — sum is ${fmt(rounded)} (should be $0)</span>`;
  }
}

document.getElementById('saveSessionBtn').addEventListener('click', () => {
  const date = document.getElementById('sessionDate').value;
  if (!date) { toast('Please select a date'); return; }

  const inputs = document.querySelectorAll('.result-input');
  if (!inputs.length) { toast('Add players first'); return; }

  const results = [...inputs].map(el => ({
    playerId: el.dataset.player,
    amount: parseFloat(el.value) || 0
  })).filter(r => r.amount !== 0);

  if (!results.length) { toast('Enter at least one result'); return; }

  const total = results.reduce((s, r) => s + r.amount, 0);
  if (Math.abs(total) > 0.5) {
    toast(`Results don't balance (off by ${fmt(total)})`);
    return;
  }

  const session = {
    id: Date.now().toString(),
    date,
    notes: document.getElementById('sessionNotes').value.trim(),
    results
  };

  state.sessions.push(session);
  save();
  toast('Session saved!');
  renderSessionForm();
  renderSidebarStats();
});

// ─── Players Page ─────────────────────────────────────────────────────────────
function renderPlayersPage() {
  renderColorPicker();
  renderPlayersList();
}

function renderColorPicker() {
  const el = document.getElementById('colorPicker');
  el.innerHTML = COLORS.map(c => `
    <div class="color-swatch ${c === selectedColor ? 'selected' : ''}"
      style="background:${c}"
      data-color="${c}">
    </div>
  `).join('');

  el.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      selectedColor = sw.dataset.color;
      el.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
    });
  });
}

function renderPlayersList() {
  const el = document.getElementById('playersList');
  if (!state.players.length) {
    el.innerHTML = '<div class="empty-state"><p>No players yet.</p></div>';
    return;
  }

  el.innerHTML = state.players.map(p => {
    const s = playerStats(p.id);
    return `
      <div class="player-item">
        <div class="player-dot" style="background:${p.color}">${initials(p.name)}</div>
        <div class="player-item-info">
          <div class="player-item-name player-link" data-id="${p.id}">${p.name}</div>
          <div class="player-item-meta">${s.sessions} sessions · ${fmt(s.total)}</div>
        </div>
        <button class="player-delete" data-id="${p.id}">✕</button>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.player-link').forEach(link => {
    link.addEventListener('click', () => showProfile(link.dataset.id));
  });

  el.querySelectorAll('.player-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const p = playerById(btn.dataset.id);
      const ok = await confirm(`Remove ${p?.name}?`, 'Their results will remain in past sessions but they won\'t appear in new sessions.');
      if (!ok) return;
      state.players = state.players.filter(p => p.id !== btn.dataset.id);
      save();
      renderPlayersList();
      renderSidebarStats();
      toast('Player removed');
    });
  });
}

document.getElementById('addPlayerBtn').addEventListener('click', () => {
  const name = document.getElementById('playerName').value.trim();
  if (!name) { toast('Enter a name'); return; }
  if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    toast('Player already exists');
    return;
  }

  state.players.push({ id: Date.now().toString(), name, color: selectedColor });
  save();
  document.getElementById('playerName').value = '';

  const usedColors = state.players.map(p => p.color);
  const next = COLORS.find(c => !usedColors.includes(c)) || COLORS[0];
  selectedColor = next;

  renderPlayersPage();
  renderSidebarStats();
  toast(`${name} added!`);
});

document.getElementById('playerName').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('addPlayerBtn').click();
});

// ─── History ──────────────────────────────────────────────────────────────────
function renderHistory() {
  const el = document.getElementById('historyList');
  if (!state.sessions.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No sessions logged yet.</p></div>';
    return;
  }

  const sorted = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date));

  el.innerHTML = sorted.map(s => `
    <div class="history-session">
      <div class="history-header">
        <span class="history-date">${formatDate(s.date)}</span>
        ${s.notes ? `<span class="history-note">${s.notes}</span>` : ''}
        <button class="history-delete" data-id="${s.id}">✕ Delete</button>
      </div>
      <div class="history-results">
        ${s.results.map(r => {
          const p = playerById(r.playerId);
          const cls = r.amount > 0 ? 'win' : r.amount < 0 ? 'loss' : 'even';
          return `
            <span class="history-chip ${cls}">
              ${p ? `${dot(p.color, 8)} ${p.name}` : 'Unknown'}
              ${fmt(r.amount)}
            </span>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');

  el.querySelectorAll('.history-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm('Delete session?', 'This action cannot be undone.');
      if (!ok) return;
      state.sessions = state.sessions.filter(s => s.id !== btn.dataset.id);
      save();
      renderHistory();
      renderSidebarStats();
      toast('Session deleted');
    });
  });
}

function exportCSV() {
  if (!state.sessions.length) { toast('No sessions to export'); return; }
  const rows = [['Date', 'Notes', 'Player', 'Net P&L']];
  const sorted = [...state.sessions].sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach(s => {
    s.results.forEach(r => {
      const p = playerById(r.playerId);
      rows.push([s.date, s.notes || '', p ? p.name : 'Unknown', r.amount]);
    });
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'poker-sessions.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV downloaded!');
}

document.getElementById('exportBtn').addEventListener('click', exportCSV);

// ─── Init ─────────────────────────────────────────────────────────────────────
function initializeMainApp() {
  renderDashboard();
  renderSidebarStats();
}

