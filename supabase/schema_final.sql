-- ============================================
-- SCHEMA FINALE DOTA-2 DASHBOARD
-- Versione pulita e completa per produzione
-- ============================================

-- ============================================
-- 1. USER PROFILE (Onboarding & User Data)
-- ============================================

CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  in_game_name TEXT,
  role_preferred TEXT CHECK (role_preferred IN ('carry', 'mid', 'offlane', 'support', 'hard_support')),
  steam_id BIGINT,
  region TEXT,
  skill_self_eval TEXT CHECK (skill_self_eval IN ('beginner', 'intermediate', 'competitive')),
  avatar TEXT,
  onboarding_status TEXT CHECK (onboarding_status IN (
    'profile_pending',
    'avatar_pending',
    'import_pending',
    'complete'
  )) DEFAULT 'profile_pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. MATCHES DIGEST (Aggiunta colonne user_id e coaching flags)
-- ============================================

-- Aggiungi colonne a matches_digest se non esistono
DO $$ 
BEGIN
  -- user_id per associare match all'utente
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'matches_digest' AND column_name = 'user_id') THEN
    ALTER TABLE matches_digest ADD COLUMN user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE;
  END IF;
  
  -- Flag per coaching eligibility
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'matches_digest' AND column_name = 'is_eligible_for_coaching') THEN
    ALTER TABLE matches_digest ADD COLUMN is_eligible_for_coaching BOOLEAN DEFAULT false;
  END IF;
  
  -- Flag per inclusion in coaching
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'matches_digest' AND column_name = 'included_in_coaching') THEN
    ALTER TABLE matches_digest ADD COLUMN included_in_coaching BOOLEAN DEFAULT false;
  END IF;
  
  -- Data match per ordinamento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'matches_digest' AND column_name = 'match_date') THEN
    ALTER TABLE matches_digest ADD COLUMN match_date TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 3. PLAYERS DIGEST (Aggiunta colonna user_id)
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'players_digest' AND column_name = 'user_id') THEN
    ALTER TABLE players_digest ADD COLUMN user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 4. PLAYER MATCH METRICS (Metriche avanzate per match)
-- ============================================

CREATE TABLE IF NOT EXISTS player_match_metrics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
  match_id BIGINT REFERENCES matches_digest(match_id) ON DELETE CASCADE,
  player_slot INTEGER,
  
  -- KPI Base
  kills INTEGER,
  deaths INTEGER,
  assists INTEGER,
  kda NUMERIC(5,2),
  
  -- Metriche Avanzate (0-100)
  aggressiveness_score NUMERIC(5,2) DEFAULT 0,
  farm_efficiency_score NUMERIC(5,2) DEFAULT 0,
  macro_score NUMERIC(5,2) DEFAULT 0,
  survivability_score NUMERIC(5,2) DEFAULT 0,
  
  -- Dettagli per fase di gioco
  early_kda NUMERIC(5,2),
  early_gpm NUMERIC(8,2),
  early_xpm NUMERIC(8,2),
  mid_kda NUMERIC(5,2),
  mid_gpm NUMERIC(8,2),
  mid_xpm NUMERIC(8,2),
  late_kda NUMERIC(5,2),
  late_gpm NUMERIC(8,2),
  late_xpm NUMERIC(8,2),
  
  -- Raw data per calcoli
  kill_participation NUMERIC(5,2),
  damage_per_minute NUMERIC(8,2),
  vision_score INTEGER,
  ward_uptime NUMERIC(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, match_id, player_slot)
);

-- ============================================
-- 5. COACHING TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS coaching_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
  task_type TEXT CHECK (task_type IN (
    'aggressiveness',
    'farm_efficiency',
    'macro',
    'survivability',
    'role_specific',
    'general'
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('active', 'completed', 'dismissed')) DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  target_value NUMERIC(5,2),
  current_value NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 6. COACHING TASK PROGRESS (Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS coaching_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES coaching_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
  match_id BIGINT REFERENCES matches_digest(match_id) ON DELETE CASCADE,
  progress_value NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. USER STATISTICS (Aggregate KPI)
-- ============================================

CREATE TABLE IF NOT EXISTS user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE UNIQUE,
  
  -- KPI Principali (ultime 20 partite incluse)
  total_matches INTEGER DEFAULT 0,
  matches_included INTEGER DEFAULT 0,
  winrate NUMERIC(5,2) DEFAULT 0,
  avg_kda NUMERIC(5,2) DEFAULT 0,
  avg_gpm NUMERIC(8,2) DEFAULT 0,
  avg_xpm NUMERIC(8,2) DEFAULT 0,
  
  -- Metriche Avanzate Aggregate
  avg_aggressiveness NUMERIC(5,2) DEFAULT 0,
  avg_farm_efficiency NUMERIC(5,2) DEFAULT 0,
  avg_macro NUMERIC(5,2) DEFAULT 0,
  avg_survivability NUMERIC(5,2) DEFAULT 0,
  
  -- Coaching Stats
  active_tasks_count INTEGER DEFAULT 0,
  completed_tasks_count INTEGER DEFAULT 0,
  weekly_progress_percentage INTEGER DEFAULT 0,
  
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profile_id ON user_profile(id);
CREATE INDEX IF NOT EXISTS idx_matches_digest_user_id ON matches_digest(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_digest_included ON matches_digest(user_id, included_in_coaching) WHERE included_in_coaching = true;
CREATE INDEX IF NOT EXISTS idx_matches_digest_date ON matches_digest(user_id, match_date DESC) WHERE match_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_digest_user_id ON players_digest(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_digest_match_id ON players_digest(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_metrics_user_match ON player_match_metrics(user_id, match_id);
CREATE INDEX IF NOT EXISTS idx_coaching_tasks_user_status ON coaching_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_coaching_task_progress_task ON coaching_task_progress(task_id);

-- ============================================
-- 9. FUNZIONI HELPER
-- ============================================

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_user_profile_updated_at ON user_profile;
CREATE TRIGGER update_user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_statistics_updated_at ON user_statistics;
CREATE TRIGGER update_user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coaching_tasks_updated_at ON coaching_tasks;
CREATE TRIGGER update_coaching_tasks_updated_at
  BEFORE UPDATE ON coaching_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funzione per popolare match_date da start_time
CREATE OR REPLACE FUNCTION set_match_date_from_start_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_time IS NOT NULL AND NEW.match_date IS NULL THEN
    NEW.match_date = to_timestamp(NEW.start_time);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_match_date_trigger ON matches_digest;
CREATE TRIGGER set_match_date_trigger
  BEFORE INSERT OR UPDATE ON matches_digest
  FOR EACH ROW
  EXECUTE FUNCTION set_match_date_from_start_time();

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Abilita RLS
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches_digest ENABLE ROW LEVEL SECURITY;
ALTER TABLE players_digest ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy esistenti se presenti (per evitare duplicati)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can view own matches" ON matches_digest;
DROP POLICY IF EXISTS "Users can view own players" ON players_digest;
DROP POLICY IF EXISTS "Users can view own metrics" ON player_match_metrics;
DROP POLICY IF EXISTS "Users can view own tasks" ON coaching_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON coaching_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON coaching_tasks;
DROP POLICY IF EXISTS "Users can view own statistics" ON user_statistics;

-- Policy: Utenti possono vedere solo i propri dati
CREATE POLICY "Users can view own profile"
  ON user_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own matches"
  ON matches_digest FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own players"
  ON players_digest FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own metrics"
  ON player_match_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks"
  ON coaching_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON coaching_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON coaching_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own statistics"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 11. MATERIALIZED VIEWS (per performance)
-- ============================================

-- View per trend utente (metriche nel tempo)
DROP MATERIALIZED VIEW IF EXISTS user_match_trend;
CREATE MATERIALIZED VIEW user_match_trend AS
SELECT 
  pm.user_id,
  md.match_date,
  pm.aggressiveness_score,
  pm.farm_efficiency_score,
  pm.macro_score,
  pm.survivability_score,
  CASE WHEN md.radiant_win = (pd.player_slot < 128) THEN true ELSE false END as won
FROM player_match_metrics pm
JOIN matches_digest md ON pm.match_id = md.match_id
JOIN players_digest pd ON pm.match_id = pd.match_id AND pm.player_slot = pd.player_slot
WHERE md.included_in_coaching = true
  AND md.match_date IS NOT NULL
ORDER BY pm.user_id, md.match_date DESC;

CREATE INDEX IF NOT EXISTS idx_user_match_trend_user_date ON user_match_trend(user_id, match_date DESC);

-- ============================================
-- 12. FUNZIONE PER CREARE USER_PROFILE ALLA REGISTRAZIONE
-- ============================================

-- Funzione trigger per creare automaticamente user_profile quando si crea un utente in auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profile (id, onboarding_status)
  VALUES (NEW.id, 'profile_pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

