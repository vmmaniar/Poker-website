// ─── Supabase Configuration ───────────────────────────────────────────────────
// Create a Supabase client - you'll need to replace these with your actual credentials
// Get these from: https://app.supabase.com -> Settings -> API

const SUPABASE_URL = 'https://gmrpnqexjdqcgdszzqwj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SrVQCMXgcEeSBVfij6SCCA_s-oZ_exy';

let supabase = null;
let currentUser = null;

function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR_')) {
    console.log('Supabase not configured - using offline mode');
    return false;
  }
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

async function signUp(email, password, name) {
  if (!supabase) return { error: 'Offline mode - please configure Supabase' };

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) return { error: error.message };

    // Create player profile in database
    if (data.user) {
      await supabase.from('players').insert([{
        id: data.user.id,
        name,
        email,
        color: '#f0b90b'
      }]);
    }

    return { user: data.user };
  } catch (err) {
    return { error: err.message };
  }
}

async function signIn(email, password) {
  if (!supabase) return { error: 'Offline mode - please configure Supabase' };

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { error: error.message };
    if (data.user) currentUser = data.user;
    return { user: data.user };
  } catch (err) {
    return { error: err.message };
  }
}

async function signOut() {
  if (!supabase) return { error: 'Offline mode' };

  try {
    await supabase.auth.signOut();
    currentUser = null;
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

async function getCurrentUser() {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (data.user) currentUser = data.user;
    return data.user;
  } catch (err) {
    return null;
  }
}

// ─── Database Operations ──────────────────────────────────────────────────────

async function syncSessionsToBackend(sessions) {
  if (!supabase || !currentUser) return false;

  try {
    for (const session of sessions) {
      // Upsert session
      const { error: sessionError } = await supabase
        .from('sessions')
        .upsert({
          id: session.id,
          user_id: currentUser.id,
          date: session.date,
          notes: session.notes,
          synced_at: new Date().toISOString()
        });

      if (sessionError) continue;

      // Upsert results
      const results = session.results.map(r => ({
        id: `${session.id}_${r.playerId}`,
        session_id: session.id,
        user_id: currentUser.id,
        player_id: r.playerId,
        amount: r.amount
      }));

      await supabase.from('results').upsert(results);
    }
    return true;
  } catch (err) {
    console.error('Sync error:', err);
    return false;
  }
}

async function getPlayerProfile(playerId) {
  if (!supabase || !currentUser) return null;

  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    return error ? null : data;
  } catch (err) {
    return null;
  }
}

async function getPlayersSessions(playerId) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('results')
      .select('sessions(date, notes), amount')
      .eq('player_id', playerId)
      .order('sessions(date)', { ascending: false });

    return error ? [] : data;
  } catch (err) {
    return [];
  }
}

// ─── Import Historical Data ───────────────────────────────────────────────────

async function importHistoricalData(gameDataArray) {
  if (!supabase || !currentUser) {
    console.log('Would import to localStorage:', gameDataArray);
    return true;
  }

  try {
    for (const game of gameDataArray) {
      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          id: game.id,
          user_id: currentUser.id,
          date: game.date,
          notes: game.notes || 'Imported historical data'
        }])
        .select();

      if (sessionError) continue;

      // Create results
      const results = game.results.map(r => ({
        id: `${game.id}_${r.playerId}`,
        session_id: game.id,
        user_id: currentUser.id,
        player_id: r.playerId,
        amount: r.amount
      }));

      await supabase.from('results').insert(results);
    }
    return true;
  } catch (err) {
    console.error('Import error:', err);
    return false;
  }
}
