# High Roller Club - Backend Setup Guide

This app now has full authentication and backend support. Follow these steps to set up:

## 1. Create Supabase Project (Free)

1. Go to https://app.supabase.com and sign up for a free account
2. Click "New Project"
3. Give it a name: `high-roller-club`
4. Choose a secure password
5. Select a region closest to you
6. Click "Create new project" (takes ~2 minutes)

## 2. Get Your Credentials

Once your project is created:

1. Go to **Settings → API**
2. Copy your **Project URL** (starts with `https://...`)
3. Copy your **Anon Public** key (under "Project API keys")

## 3. Update App Configuration

1. Open `supabase-client.js` in the app folder
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';      // Paste your URL here
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // Paste your key here
```

## 4. Create Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Create users/players table
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

-- Create results table
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

-- Enable RLS (Row Level Security)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own data
CREATE POLICY "Users can see own players" ON players
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can see own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can see own results" ON results
  FOR SELECT USING (auth.uid() = user_id);
```

4. Click **Run** to execute the schema

## 5. Test Authentication

1. Open the app in your browser
2. You should see a login screen
3. Click "Sign up" to create a new account
4. Enter:
   - Player Name: Your name
   - Email: Your email
   - Password: At least 8 characters
5. The historical game data will import automatically on first login!

## 6. Deploy to Vercel

### Prerequisites:
- GitHub account
- Vercel account (free)

### Steps:

1. **Initialize git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Add backend infrastructure with Supabase auth"
   ```

2. **Push to GitHub**:
   - Go to https://github.com/new
   - Create a new repo called `poker-website`
   - Follow the instructions to push your code

3. **Deploy to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repo
   - Add environment variables:
     ```
     VITE_SUPABASE_URL = (your Supabase URL)
     VITE_SUPABASE_ANON_KEY = (your Supabase key)
     ```
   - Click **Deploy**
   - Your app is live!

## 7. Troubleshooting

### "Offline mode" message?
- Check that `supabase-client.js` has the correct URL and key
- Make sure you've created the database schema in Supabase
- Check browser console for specific errors

### Historical data not importing?
- Clear localStorage and log in again
- The import runs automatically on first login
- Check browser console for any import errors

### Can't create account?
- Make sure password is at least 8 characters
- Use a valid email address
- Check that Supabase project is active (go to https://app.supabase.com)

## Support

If you have issues:
1. Check browser console (F12) for error messages
2. Verify Supabase credentials in `supabase-client.js`
3. Make sure the database schema was created correctly

Happy poker tracking! ♠
