-- ============================================
-- FZTH DOTA 2 - VERIFICA DATI DEMO PLAYER
-- ============================================
-- Player Demo: #86745912
-- Match di Test: #7792959229
-- ============================================

-- 1. VERIFICA matches_digest (ultime 20 partite)
-- Verifica che i dati aggregati siano coerenti con l'UI
SELECT 
  player_account_id,
  COUNT(*) as total_matches,
  COUNT(CASE WHEN result = 'win' THEN 1 END) as wins,
  COUNT(CASE WHEN result = 'lose' THEN 1 END) as losses,
  ROUND(COUNT(CASE WHEN result = 'win' THEN 1 END)::numeric / COUNT(*) * 100, 1) as win_rate,
  ROUND(AVG(gold_per_min), 0) as avg_gpm,
  ROUND(AVG(xp_per_min), 0) as avg_xpm,
  ROUND(AVG(last_hits), 0) as avg_last_hits,
  ROUND(AVG(denies), 0) as avg_denies,
  ROUND(AVG(hero_damage), 0) as avg_hero_damage,
  ROUND(AVG(tower_damage), 0) as avg_tower_damage,
  ROUND(AVG(kills), 1) as avg_kills,
  ROUND(AVG(deaths), 1) as avg_deaths,
  ROUND(AVG(assists), 1) as avg_assists
FROM matches_digest
WHERE player_account_id = 86745912
GROUP BY player_account_id;

-- 2. VERIFICA dota_player_match_analysis
-- Verifica dati analisi avanzata (fasi, dead gold, ecc.)
SELECT 
  account_id,
  COUNT(*) as total_analysis,
  ROUND(AVG(total_gold_lost), 0) as avg_dead_gold,
  ROUND(AVG(kills_early + kills_mid + kills_late), 1) as avg_total_kills,
  ROUND(AVG(deaths_early + deaths_mid + deaths_late), 1) as avg_total_deaths,
  ROUND(AVG(kills_early), 1) as avg_kills_early,
  ROUND(AVG(kills_mid), 1) as avg_kills_mid,
  ROUND(AVG(kills_late), 1) as avg_kills_late
FROM dota_player_match_analysis
WHERE account_id = 86745912
GROUP BY account_id;

-- 3. VERIFICA dota_player_death_events (per heatmap)
-- Verifica che ci siano posizioni per il calcolo della heatmap
SELECT 
  account_id,
  COUNT(*) as total_deaths,
  COUNT(DISTINCT match_id) as matches_with_deaths,
  COUNT(CASE WHEN pos_x IS NOT NULL AND pos_y IS NOT NULL THEN 1 END) as deaths_with_position,
  ROUND(AVG(pos_x), 0) as avg_pos_x,
  ROUND(AVG(pos_y), 0) as avg_pos_y
FROM dota_player_death_events
WHERE account_id = 86745912
GROUP BY account_id;

-- 4. VERIFICA match specifico (es. 7792959229)
-- Verifica che i dati del match detail siano corretti
SELECT 
  match_id,
  player_account_id,
  hero_id,
  result,
  kills,
  deaths,
  assists,
  ROUND((kills + assists)::numeric / NULLIF(deaths, 0), 2) as kda,
  gold_per_min,
  xp_per_min,
  last_hits,
  denies,
  hero_damage,
  tower_damage,
  duration_seconds,
  start_time
FROM matches_digest
WHERE match_id = 7792959229
  AND player_account_id = 86745912;

-- 5. VERIFICA analisi match specifico
-- Verifica kill distribution per fase
SELECT 
  match_id,
  account_id,
  kills_early,
  kills_mid,
  kills_late,
  deaths_early,
  deaths_mid,
  deaths_late,
  total_gold_lost,
  (kills_early + kills_mid + kills_late) as total_kills,
  (deaths_early + deaths_mid + deaths_late) as total_deaths
FROM dota_player_match_analysis
WHERE match_id = 7792959229
  AND account_id = 86745912;

-- 6. VERIFICA ultime 20 partite (coerenza con getLastMatches)
-- Verifica che la funzione getLastMatches restituisca le stesse partite
SELECT 
  match_id,
  start_time,
  result,
  hero_id,
  kills,
  deaths,
  assists,
  gold_per_min
FROM matches_digest
WHERE player_account_id = 86745912
ORDER BY start_time DESC
LIMIT 20;

-- 7. VERIFICA coerenza tra matches_digest e dota_player_match_analysis
-- Verifica che ogni match in matches_digest abbia una corrispondente analisi
SELECT 
  md.match_id,
  md.player_account_id,
  CASE WHEN dma.match_id IS NULL THEN 'MISSING ANALYSIS' ELSE 'OK' END as analysis_status
FROM matches_digest md
LEFT JOIN dota_player_match_analysis dma 
  ON md.match_id = dma.match_id 
  AND md.player_account_id = dma.account_id
WHERE md.player_account_id = 86745912
ORDER BY md.start_time DESC
LIMIT 20;

-- 8. VERIFICA dati vision (se tabella esiste)
-- Questa query fallirà se dota_vision non esiste (previsto)
-- SELECT 
--   account_id,
--   COUNT(*) as total_vision_records,
--   SUM(obs_placed) as total_obs_placed,
--   SUM(sen_placed) as total_sen_placed
-- FROM dota_vision
-- WHERE account_id = 86745912
-- GROUP BY account_id;

-- 9. VERIFICA dati item progression (se tabella esiste)
-- Questa query fallirà se dota_item_progression non esiste (previsto)
-- SELECT 
--   account_id,
--   COUNT(*) as total_item_records,
--   COUNT(DISTINCT match_id) as matches_with_items
-- FROM dota_item_progression
-- WHERE account_id = 86745912
-- GROUP BY account_id;

