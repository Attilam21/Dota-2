-- ============================================
-- SCHEMA COMPLETO DOTA-2 DASHBOARD
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
-- 2. MATCHES (già esistente, aggiungiamo colonne)
-- ============================================

-- Aggiungi colonne a matches_digest se non esistono
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'matches_digest' AND column_name = 'user_id') THEN
    ALTER TABLE matches_digest ADD COLUMN user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'matches_digest' AND column_name = 'is_eligible_for_coaching') THEN
    ALTER TABLE matches_digest ADD COLUMN is_eligible_for_coaching BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'matches_digest' AND column_name = 'included_in_coaching') THEN
    ALTER TABLE matches_digest ADD COLUMN included_in_coaching BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'matches_digest' AND column_name = 'match_date') THEN
    ALTER TABLE matches_digest ADD COLUMN match_date TIMESTAMPTZ;
  END IF;
END $$;

-- Aggiungi colonne a players_digest se non esistono
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'players_digest' AND column_name = 'user_id') THEN
    ALTER TABLE players_digest ADD COLUMN user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 3. PLAYER MATCH METRICS (Metriche avanzate)
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
  win_rate NUMERIC(5,2),
  
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
-- 4. COACHING TASKS
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
-- 5. COACHING TASK PROGRESS (Tracking)
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
-- 6. USER STATISTICS (Aggregate KPI)
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
-- 7. INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profile_id ON user_profile(id);
CREATE INDEX IF NOT EXISTS idx_matches_digest_user_id ON matches_digest(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_digest_included ON matches_digest(user_id, included_in_coaching) WHERE included_in_coaching = true;
CREATE INDEX IF NOT EXISTS idx_matches_digest_date ON matches_digest(user_id, match_date DESC);
CREATE INDEX IF NOT EXISTS idx_players_digest_user_id ON players_digest(user_id);
CREATE INDEX IF NOT EXISTS idx_player_match_metrics_user_match ON player_match_metrics(user_id, match_id);
CREATE INDEX IF NOT EXISTS idx_coaching_tasks_user_status ON coaching_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_coaching_task_progress_task ON coaching_task_progress(task_id);

-- ============================================
-- 8. FUNZIONI HELPER
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
CREATE TRIGGER update_user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_tasks_updated_at
  BEFORE UPDATE ON coaching_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Abilita RLS
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches_digest ENABLE ROW LEVEL SECURITY;
ALTER TABLE players_digest ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- Policy: Utenti possono vedere solo i propri dati
CREATE POLICY "Users can view own profile"
  ON user_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own matches"
  ON matches_digest FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own players"
  ON players_digest FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics"
  ON player_match_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks"
  ON coaching_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON coaching_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own statistics"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 10. MATERIALIZED VIEWS (per performance)
-- ============================================

-- View per statistiche eroi aggregate (già esistente, manteniamo)
-- Aggiungiamo view per trend utente

CREATE MATERIALIZED VIEW IF NOT EXISTS user_match_trend AS
SELECT 
  pm.user_id,
  md.match_date,
  pm.aggressiveness_score,
  pm.farm_efficiency_score,
  pm.macro_score,
  pm.survivability_score,
  md.radiant_win = (pd.player_slot < 128) as won
FROM player_match_metrics pm
JOIN matches_digest md ON pm.match_id = md.match_id
JOIN players_digest pd ON pm.match_id = pd.match_id AND pm.player_slot = pd.player_slot
WHERE md.included_in_coaching = true
ORDER BY pm.user_id, md.match_date DESC;

CREATE INDEX IF NOT EXISTS idx_user_match_trend_user_date ON user_match_trend(user_id, match_date DESC);

