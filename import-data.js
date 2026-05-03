// ─── Historical Game Data Import ──────────────────────────────────────────────
// This file contains all historical poker game data for bulk import

const HISTORICAL_GAMES = [
  {
    id: 'game_2026_04_22_001',
    date: '2026-04-22',
    notes: 'Imported from historical data',
    results: [
      { playerId: 'player_anurag', playerName: 'Anurag', amount: -470 },
      { playerId: 'player_diwanji', playerName: 'Diwanji', amount: -130 },
      { playerId: 'player_vikram', playerName: 'Vikram', amount: 140 },
      { playerId: 'player_ujjwal', playerName: 'Ujjwal', amount: -90 },
      { playerId: 'player_vansh', playerName: 'Vansh', amount: 550 }
    ]
  },
  {
    id: 'game_2026_04_24_001',
    date: '2026-04-24',
    notes: 'Imported from historical data',
    results: [
      { playerId: 'player_anurag', playerName: 'Anurag', amount: -600 },
      { playerId: 'player_utkarsh', playerName: 'Utkarsh', amount: -400 },
      { playerId: 'player_tanush', playerName: 'Tanush', amount: 365 },
      { playerId: 'player_ujjwal', playerName: 'Ujjwal', amount: 125 },
      { playerId: 'player_vansh', playerName: 'Vansh', amount: 585 }
    ]
  },
  {
    id: 'game_2026_04_26_001',
    date: '2026-04-26',
    notes: 'Imported from historical data',
    results: [
      { playerId: 'player_diwanji', playerName: 'Diwanji', amount: -800 },
      { playerId: 'player_ujjwal', playerName: 'Ujjwal', amount: 1800 },
      { playerId: 'player_vansh', playerName: 'Vansh', amount: -800 },
      { playerId: 'player_sachil', playerName: 'Sachil', amount: -200 }
    ]
  },
  {
    id: 'game_2026_04_28_001',
    date: '2026-04-28',
    notes: 'Imported from historical data',
    results: [
      { playerId: 'player_anurag', playerName: 'Anurag', amount: 90 },
      { playerId: 'player_diwanji', playerName: 'Diwanji', amount: -400 },
      { playerId: 'player_vikram', playerName: 'Vikram', amount: -260 },
      { playerId: 'player_ujjwal', playerName: 'Ujjwal', amount: 15 },
      { playerId: 'player_vansh', playerName: 'Vansh', amount: 1160 },
      { playerId: 'player_sachil', playerName: 'Sachil', amount: -290 }
    ]
  },
  {
    id: 'game_2026_05_01_001',
    date: '2026-05-01',
    notes: 'Imported from historical data',
    results: [
      { playerId: 'player_anurag', playerName: 'Anurag', amount: 175 },
      { playerId: 'player_diwanji', playerName: 'Diwanji', amount: 15 },
      { playerId: 'player_vikram', playerName: 'Vikram', amount: 305 },
      { playerId: 'player_utkarsh', playerName: 'Utkarsh', amount: -210 },
      { playerId: 'player_tanush', playerName: 'Tanush', amount: -60 },
      { playerId: 'player_ujjwal', playerName: 'Ujjwal', amount: -25 },
      { playerId: 'player_sachil', playerName: 'Sachil', amount: -600 },
      { playerId: 'player_maurya', playerName: 'Maurya', amount: 305 }
    ]
  },
  {
    id: 'game_2026_05_01_002',
    date: '2026-05-01',
    notes: 'Imported from historical data',
    results: [
      { playerId: 'player_anurag', playerName: 'Anurag', amount: -400 },
      { playerId: 'player_ujjwal', playerName: 'Ujjwal', amount: 850 },
      { playerId: 'player_sachil', playerName: 'Sachil', amount: -50 },
      { playerId: 'player_maurya', playerName: 'Maurya', amount: -400 }
    ]
  }
];

// All unique players from historical data
const HISTORICAL_PLAYERS = [
  { id: 'player_anurag', name: 'Anurag', color: '#f0b90b' },
  { id: 'player_diwanji', name: 'Diwanji', color: '#22c55e' },
  { id: 'player_vikram', name: 'Vikram', color: '#3b82f6' },
  { id: 'player_utkarsh', name: 'Utkarsh', color: '#a855f7' },
  { id: 'player_tanush', name: 'Tanush', color: '#ef4444' },
  { id: 'player_ujjwal', name: 'Ujjwal', color: '#f97316' },
  { id: 'player_vansh', name: 'Vansh', color: '#06b6d4' },
  { id: 'player_sachil', name: 'Sachil', color: '#ec4899' },
  { id: 'player_maurya', name: 'Maurya', color: '#84cc16' }
];

async function importHistoricalData() {
  const currentUser = getCurrentUserEmail();
  if (!currentUser) {
    console.log('User not logged in, cannot import');
    return false;
  }

  console.log('Importing historical data...');

  try {
    // Add players if not already added
    const existing = JSON.parse(localStorage.getItem('pokerNight') || '{}').players || [];
    const existingIds = existing.map(p => p.id);

    const newPlayers = HISTORICAL_PLAYERS.filter(p => !existingIds.includes(p.id));
    if (newPlayers.length > 0) {
      const data = JSON.parse(localStorage.getItem('pokerNight') || '{"players":[],"sessions":[]}');
      data.players = [...(data.players || []), ...newPlayers];
      localStorage.setItem('pokerNight', JSON.stringify(data));
      console.log(`Added ${newPlayers.length} new players`);
    }

    // Import games
    const gamesData = JSON.parse(localStorage.getItem('pokerNight') || '{}');
    const existingGameIds = (gamesData.sessions || []).map(s => s.id);

    const newGames = HISTORICAL_GAMES.filter(g => !existingGameIds.includes(g.id));
    if (newGames.length > 0) {
      gamesData.sessions = [...(gamesData.sessions || []), ...newGames];
      localStorage.setItem('pokerNight', JSON.stringify(gamesData));
      console.log(`Imported ${newGames.length} historical games`);
    }

    // If online mode, sync to Supabase
    if (isOnlineMode && supabase) {
      await importHistoricalData([...newPlayers.map(p => ({ type: 'player', ...p })), ...newGames.map(g => ({ type: 'game', ...g }))]);
    }

    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
}

// Check if historical data should be imported
function shouldImportHistoricalData() {
  const data = JSON.parse(localStorage.getItem('pokerNight') || '{}');
  // Import if there are no sessions or few players
  return (!data.sessions || data.sessions.length === 0) && (!data.players || data.players.length < 5);
}
