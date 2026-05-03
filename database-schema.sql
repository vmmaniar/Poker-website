-- High Roller Club Database Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com -> SQL Editor -> New Query

-- Create players table (one per user)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#f0b90b',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  notes TEXT,
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create results table (individual player results per session)
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_results_session_id ON results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_player_id ON results(player_id);

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON players
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON players
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own results" ON results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results" ON results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own results" ON results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own results" ON results
  FOR DELETE USING (auth.uid() = user_id);

-- Create auth trigger to auto-create player record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (id, email, name, color)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    '#f0b90b'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
