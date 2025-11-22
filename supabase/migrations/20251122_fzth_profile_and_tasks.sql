-- ============================================
-- FZTH PLAYER PROFILE SNAPSHOTS
-- ============================================
create table if not exists public.fzth_player_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  -- riferimento al player (stesso tipo di player_account_id usato nelle tabelle match)
  player_account_id bigint not null,
  -- momento di calcolo dello snapshot
  snapshot_at timestamptz not null default timezone('utc', now()),
  -- periodo di riferimento dello snapshot: '7d', '30d', '90d', 'all_time', ecc.
  period text not null default 'all_time',
  -- metrica FZTH aggregata
  fzth_score int not null,
  fzth_level int not null,
  next_level_score int,
  progress_to_next int, -- 0–100 %
  -- identità di gioco
  main_role text,        -- es. "core / safe"
  main_playstyle text,   -- es. "Aggressivo", "Macro oriented"
  -- pilastri FZTH (0–100)
  laning_score int,
  macro_score int,
  teamfight_score int,
  consistency_score int,
  hero_pool_score int,
  -- indicatori di contesto
  matches_played int,
  winrate numeric(5,2),    -- percentuale 0–100
  avg_kda numeric(6,2),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_fzth_profile_snapshots_player_period
  on public.fzth_player_profile_snapshots (player_account_id, period, snapshot_at desc);

-- ============================================
-- MASTER TASK DI COACHING
-- ============================================
create table if not exists public.fzth_coaching_tasks (
  id uuid primary key default gen_random_uuid(),
  -- codice tecnico univoco del task (es. "LANING_CS_10MIN_V1")
  code text not null unique,
  -- nome visibile al giocatore
  title text not null,
  -- descrizione estesa del task
  description text,
  -- pilastro FZTH collegato: 'laning' | 'macro' | 'teamfight' | 'consistency' | 'hero_pool'
  pillar text not null,
  -- 1=facile, 2=medio, 3=difficile (estendibile)
  difficulty smallint not null default 1,
  -- se il task è disponibile o dismesso
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_fzth_coaching_tasks_pillar
  on public.fzth_coaching_tasks (pillar);

-- ============================================
-- TASK ASSEGNATI AI PLAYER
-- ============================================
create table if not exists public.fzth_player_tasks (
  id uuid primary key default gen_random_uuid(),
  player_account_id bigint not null,
  task_id uuid not null references public.fzth_coaching_tasks(id) on delete cascade,
  -- stato corrente del task per il player:
  -- 'pending' | 'in_progress' | 'completed' | 'blocked'
  status text not null default 'pending',
  -- opzionale: match che ha generato il task (es. da errore critico)
  source_match_id bigint,
  -- note libere (es. commenti del coach o auto-valutazioni)
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create index if not exists idx_fzth_player_tasks_player
  on public.fzth_player_tasks (player_account_id);

create index if not exists idx_fzth_player_tasks_status
  on public.fzth_player_tasks (status);

create index if not exists idx_fzth_player_tasks_task
  on public.fzth_player_tasks (task_id);

