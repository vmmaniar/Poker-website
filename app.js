// ─── State ───────────────────────────────────────────────────────────────────
const COLORS = [
  '#f0b90b','#22c55e','#3b82f6','#a855f7','#ef4444',
  '#f97316','#06b6d4','#ec4899','#84cc16','#8b5cf6'
];

let state = load();
let selectedColor = COLORS[0];
let pnlChart = null;

function load() {
  try {
    const raw = localStorage.getItem('pokerNight');
    return raw ? JSON.parse(raw) : { players: [], sessions: [] };
  } catch { return { players: [], sessions: [] }; }
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
  const sessions = state.sessions.filter(s =>
    s.results.some(r => r.playerId === playerId)
  );
  let total = 0, wins = 0, losses = 0, best = -Infinity, worst = Infinity;
  sessions.forEach(s => {
    const r = s.results.find(r => r.playerId === playerId);
    if (!r) return;
    total += r.amount;
    if (r.amount > 0) wins++;
    else if (r.amount < 0) losses++;
    if (r.amount > best) best = r.amount;
    if (r.amount < worst) worst = r.amount;
  });
  return {
    total,
    sessions: sessions.length,
    wins,
    losses,
    winRate: sessions.length ? Math.round((wins / sessions.length) * 100) : 0,
    best: best === -Infinity ? 0 : best,
    worst: worst === Infinity ? 0 : worst,
    avg: sessions.length ? total / sessions.length : 0
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

// ─── Dashboard ────────────────────────────────────────────────────────────────
function renderDashboard() {
  renderStatCards();
  renderLeaderboard();
  renderPnlChart();
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

  // biggest single win
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

  // leading player
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

  const rankLabels = ['🥇','🥈','🥉'];

  el.innerHTML = sorted.map((p, i) => `
    <div class="lb-row">
      <span class="lb-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${rankLabels[i] || (i + 1)}</span>
      <div class="player-dot" style="background:${p.color}">${initials(p.name)}</div>
      <div style="flex:1">
        <div class="lb-name">${p.name}</div>
        <div class="lb-sessions">${p.stats.sessions} sessions · ${p.stats.winRate}% win rate</div>
      </div>
      <span class="lb-amount ${colorClass(p.stats.total)}">${fmt(p.stats.total)}</span>
    </div>
  `).join('');
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
          labels: { color: '#8892a4', font: { size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          backgroundColor: '#1a1e2a',
          borderColor: '#252a38',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#8892a4',
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#4b566b', font: { size: 10 }, maxTicksLimit: 8 },
          grid: { color: '#1a1e2a' }
        },
        y: {
          ticks: {
            color: '#4b566b',
            font: { size: 10 },
            callback: v => '$' + v
          },
          grid: { color: '#1a1e2a' }
        }
      }
    }
  });
}

function renderPlayerInsights() {
  const el = document.getElementById('playerInsights');
  if (!state.players.length) {
    el.innerHTML = '<div class="empty-state"><p>No player data yet.</p></div>';
    return;
  }

  el.innerHTML = state.players.map(p => {
    const s = playerStats(p.id);
    return `
      <div class="insight-card" style="border-left-color:${p.color}">
        <div class="insight-name">
          <div class="player-dot" style="background:${p.color};width:24px;height:24px;font-size:0.7rem">${initials(p.name)}</div>
          ${p.name}
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
        </div>
      </div>
    `;
  }).join('');
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
          <div class="player-item-name">${p.name}</div>
          <div class="player-item-meta">${s.sessions} sessions · ${fmt(s.total)}</div>
        </div>
        <button class="player-delete" data-id="${p.id}">✕</button>
      </div>
    `;
  }).join('');

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

  // pick next unused color
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

// ─── Init ─────────────────────────────────────────────────────────────────────
renderDashboard();
renderSidebarStats();
