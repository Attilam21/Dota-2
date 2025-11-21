# Tier-2 Decommission – Fase 1

**Data:** 2025-01-27  
**Versione:** 3.0.0  
**Status:** ✅ COMPLETATO

---

## 1. OBIETTIVO

Pulizia totale di tutti i moduli/elementi UI "Tier-2" non supportati dalle API attuali e allineamento della dashboard ai soli dati realmente disponibili (Tier-1).

**Vincolo forte:** Solo dati da tabelle Supabase (`matches_digest`, `dota_player_match_analysis`, `dota_player_death_events`, `player_hero_stats`, `player_lane_role_stats`) e dati grezzi OpenDota (match detail, player stats, gold/xp timeline, kills_log, killed_by).

---

## 2. FEATURE RIMOSSE (TIER-2)

### 2.1 Radar / Stile di Gioco

**Componenti Eliminati:**
- ❌ `PlaystyleRadar` (radar chart a 4 assi: Aggressività, Farm, Macro, KP%)
- ❌ Sezione "Stile di Gioco – Radar" in `performance/page.tsx`
- ❌ Interpretazione Radar con link a Coaching

**File Modificati:**
- `src/app/dashboard/performance/page.tsx` (linee 339-381)

**Motivo:** Mostra indici sintetici avanzati (0-100) non direttamente derivati da KPI Tier-1 esistenti nelle tabelle attuali.

---

### 2.2 Indici Sintetici Avanzati

**Componenti Eliminati:**
- ❌ "Indice di Aggressività" (score 0-100 calcolato da `killsPerMinute * 20`)
- ❌ "Recovery Index" (`RecoveryScore` component)
- ❌ `FightPositioning` component (se presente)

**File Modificati:**
- `src/app/dashboard/performance/page.tsx` (linee 383-456)

**Motivo:** Indicatori compositi (0-100) non direttamente derivati da KPI Tier-1. I dati base (kills/min, GPM, XPM) sono già disponibili e mostrati separatamente.

---

### 2.3 Statistiche Aggiuntive Obsolete

**Componenti Eliminati:**
- ❌ Box "Statistiche Aggiuntive" con:
  - Aggressività X/100
  - Consistenza X/100
  - Streak recente (es. "Sconfitte consecutive: 4")

**File Modificati:**
- `src/app/dashboard/page.tsx` (linee 706-768)

**Motivo:** Indicatori compositi non basati su tabelle attuali. Le statistiche base (partite totali, hero pool size) sono già disponibili direttamente da `rows`.

---

### 2.4 Insight Vecchi e Testuali Non Allineati

**Componenti Eliminati:**
- ❌ Box "Punti di Forza" / "Aree di Miglioramento" generici
- ❌ Testi che citano KP%, obiettivi, macro-play e altre metriche non calcolate veramente

**File Modificati:**
- `src/app/dashboard/page.tsx` (linee 770-813)

**Motivo:** Insight generici non allineati a dati reali delle tabelle attuali. Gli insight devono essere basati su KPI Tier-1 specifici (KDA, GPM, winrate, ecc.) non su logiche compositive.

**Calcoli Rimossi:**
- `calculatePlayerTelemetry()` (utilizzato solo per componenti Tier-2)
- `telemetry`, `sparklineData`, `wowInsights`, `gamePhases`, `consistency`, `insights` (calcoli non più utilizzati nel JSX)

---

### 2.5 Hero Pool – Matrici Avanzate

**Componenti Eliminati:**
- ❌ `HeroPoolMatrix` (Frequency matrix / quadranti)
- ❌ Quadranti: Comfort Picks, Overused/Underperforming, High WR/Low Usage, Unexplored
- ❌ Legende e interpretazioni collegate

**File Modificati:**
- `src/app/dashboard/heroes/page.tsx` (linee 14-186, 599-619)

**Motivo:** Matrice non direttamente derivata da KPI Tier-1 esistenti nelle tabelle attuali. Mantenuti solo i grafici e tabelle base (Top 5 per winrate, Top 5 più giocati) che usano dati reali.

---

### 2.6 KPI per Fase di Gioco NON Supportate

**Componenti Eliminati:**
- ❌ Box "KPI per fase di gioco" (Mid Game / Late Game) con:
  - Partecipazione torri
  - Partecipazione Roshan
  - Kill Participation (KP%)
  - Impact Index

**File Modificati:**
- `src/app/dashboard/performance/page.tsx` (già rimosso in fase precedente, linee 461-611)

**Motivo:** Metriche che richiedono dati non presenti nelle tabelle attuali (richiedono parsed avanzato o timeline dettagliata non sempre disponibile).

---

### 2.7 Death by Role e Heatmap Non Supportate

**Componenti Eliminati:**
- ❌ Sezione "Death by Role" (già rimossa in fase precedente)
- ❌ Placeholder "Heatmap morti" (già rimosso in fase precedente)

**File Modificati:**
- `src/app/dashboard/matches/[matchId]/page.tsx` (già rimosso in fase precedente)
- `src/app/dota/matches/[matchId]/players/[accountId]/page.tsx` (già rimosso in fase precedente)

**Motivo:** Dipendono da `deaths_log` e `killed_by` che non sono garantiti da OpenDota API.

---

## 3. WIDGET TIER-1 RIMASTI

### 3.1 Dashboard Giocatore (`src/app/dashboard/page.tsx`)

**Sezioni Mantenute:**
- ✅ Trend ultime 20 partite (Line chart per Winrate%, KDA, GPM, XPM da `matches_digest`)
- ✅ Overview KPI aggregati (KDA medio, GPM medio, XPM medio, durata media)
- ✅ Hero pool base:
  - Numero totale eroi
  - Eroe più giocato
  - Top 3 eroi per WR / per utilizzo (da aggregazioni base)

**Fonte Dati:**
- `matches_digest` (KDA, GPM, XPM, risultato, role, lane)
- Aggregazioni base da match list
- Calcoli da dati garantiti (winrate, KDA medio, ecc.)

---

### 3.2 Dashboard Performance (`src/app/dashboard/performance/page.tsx`)

**Sezioni Mantenute:**
- ✅ Performance Aggregata (KDA/GPM/XPM trend da `matches_digest`)
- ✅ Consistenza (deviazione standard KDA/GPM, winrate globale vs recente)

**Fonte Dati:**
- `matches_digest` (KDA, GPM, XPM)
- Calcoli statistici base (deviazione standard, media)

---

### 3.3 Match Detail Page (`src/app/dashboard/matches/[matchId]/page.tsx`)

**Sezioni Mantenute:**
- ✅ Overview partita (KDA, GPM/XPM, CS/Denies, durata)
- ✅ Gold difference timeline (sparkline da `gold_diff` garantito)
- ✅ Kills per intervallo (10 min) – Team vs Enemy (da `kills_per_min` garantito)
- ✅ Kill Distribution per fase (Early/Mid/Late) – da `kills_log` garantito (Tier-1)
- ✅ Insight Match (basato su KDA, GPM, heroDamage, towerDamage garantiti)

**Fonte Dati:**
- Match detail API (base stats)
- `dota_player_match_analysis` (killDistribution - Tier 1)
- Timeline OpenDota (gold_diff, kills_by_interval)

---

### 3.4 Hero Pool Page (`src/app/dashboard/heroes/page.tsx`)

**Sezioni Mantenute:**
- ✅ Top 5 eroi per winrate
- ✅ Top 5 eroi più giocati
- ✅ Tabelle base con statistiche eroi

**Fonte Dati:**
- Aggregazioni base da match list (matches, wins, winrate, KDA)

---

## 4. FIX UX IMPLEMENTATI

### 4.1 Trend Crollo Verticale KDA

**Problema:** Linea KDA crollava a 0 quando mancavano dati.

**Soluzione:**
- ✅ Gestione NaN e valori mancanti
- ✅ Interpolazione "flat" sull'ultimo valore valido
- ✅ Filtro dati invalidi prima del rendering

**File Modificato:**
- `src/app/dashboard/page.tsx` (linee 433-458)

**Codice:**
```typescript
// Usa ultimo valore valido se NaN o 0
const validKda = isNaN(kda) || kda === 0 ? lastValidKda : kda
if (validKda > 0) lastValidKda = validKda

// Filtro finale
.filter((d) => !isNaN(d.kda) && !isNaN(d.gpm) && !isNaN(d.winrate))
```

---

### 4.2 Fallback Dati

**Problema:** Card mostrava "0,0,0" quando mancavano dati.

**Soluzione:**
- ✅ Messaggi neutri invece di valori zero artificiali
- ✅ Utilizzo di `formatNumberOrNA`, `formatPercentageOrNA` dove presenti
- ✅ Messaggio: "Dati non disponibili per questa sezione (dataset limitato per questo account)"

**File Modificati:**
- `src/app/dashboard/page.tsx` (linea 613)
- `src/app/dashboard/performance/page.tsx` (linea 237)

---

### 4.3 Hero Name Troncato

**Problema:** Nomi eroi troncati ("Shadow F...").

**Soluzione:**
- ✅ `text-overflow: ellipsis` + `title`/tooltip con nome completo
- ✅ Layout con `min-w-0` e `truncate` per gestire overflow

**File Modificati:**
- `src/app/dashboard/page.tsx` (linea 678)
- `src/app/dashboard/matches/page.tsx` (linea 225)

---

## 5. PULIZIA CODICE

### 5.1 Import Rimossi

**File:** `src/app/dashboard/page.tsx`
- ❌ `calculatePlayerTelemetry`, `TelemetryMatchRow` da `@/lib/analytics/playerTelemetry`

**File:** `src/app/dashboard/performance/page.tsx`
- ❌ `PlaystyleRadar` da `@/components/dota/performance/PlaystyleRadar`
- ❌ `RecoveryScore` da `@/components/dota/performance/RecoveryScore`
- ❌ `FightPositioning` da `@/components/dota/performance/FightPositioning`

---

### 5.2 Calcoli Rimossi

**File:** `src/app/dashboard/page.tsx`
- ❌ `playerTelemetry` (utilizzato solo per componenti Tier-2)
- ❌ `telemetry` (per TelemetryPills - componente non più utilizzato)
- ❌ `sparklineData` (per SparklineKpi - componente non più utilizzato)
- ❌ `wowInsights` (per WowInsights - componente non più utilizzato)
- ❌ `gamePhases` (per GamePhasesMatrix - componente non più utilizzato)
- ❌ `consistency` (calcolo non più utilizzato nel JSX)
- ❌ `insights` (insight generici non più utilizzati nel JSX)

---

### 5.3 Funzioni Rimosse

**File:** `src/app/dashboard/heroes/page.tsx`
- ❌ `HeroPoolMatrix` function (linee 14-186)

---

## 6. VERIFICA FINALE

### ✅ Checklist Completa

- [x] Tutti i componenti Tier-2 rimossi
- [x] Import non utilizzati rimossi
- [x] Calcoli non utilizzati rimossi
- [x] Funzioni non utilizzate rimosse
- [x] Trend crollo verticale fixato
- [x] Fallback dati corretti
- [x] Hero name troncato fixato
- [x] Type-check passato
- [x] Lint passato
- [x] Report generato

### ✅ Acceptance Criteria

**1. In produzione locale:**
- ✅ Tutte le pagine Dota2 si caricano senza errori console
- ✅ Nessuna card mostra KPI fittizi o 0/100 derivati da logiche non più presenti
- ✅ I grafici mostrano SOLO dati effettivi; in loro assenza, messaggio "Dati non disponibili…"

**2. Coerenza visiva:**
- ✅ Nessun buco grafico dopo rimozione moduli
- ✅ Palette colori e tipografia restano allineati al branding FZTH

**3. Codice:**
- ✅ `pnpm type-check` OK
- ✅ `pnpm lint` OK
- ✅ Nessun import inutilizzato relativo ai moduli eliminati

---

## 7. MAPPATURA WIDGET TIER-1 ↔ FONTE DATI

| Widget | Fonte Dati | Tabella/Field |
|--------|-----------|---------------|
| Trend ultime 20 partite | `matches_digest` | `kda`, `gpm`, `xp_per_min`, `result` |
| Overview KPI aggregati | `matches_digest` | `kda`, `gpm`, `xp_per_min` (media) |
| Hero pool base | Aggregazioni match list | `hero_id`, `matches`, `winrate` (calcolato) |
| Performance Aggregata | `matches_digest` | `kda`, `gpm`, `xp_per_min` (serie) |
| Consistenza | `matches_digest` | Deviazione standard calcolata da `kda`, `gpm` |
| Overview match | Match detail API | `kills`, `deaths`, `assists`, `gpm`, `xpm`, `last_hits`, `denies` |
| Gold difference timeline | Timeline OpenDota | `gold_diff` / `gold_t` (Array<number>) |
| Kills per intervallo | Timeline OpenDota | `kills_per_min` / `kills_by_interval` (Array<number>) |
| Kill Distribution per fase | `dota_player_match_analysis` | `kills_early`, `kills_mid`, `kills_late` |
| Insight Match | Match detail API | `kda`, `gpm`, `hero_damage`, `tower_damage` |

---

## 8. CONCLUSIONE

La decommission Tier-2 è stata completata con successo. La dashboard Dota 2 ora:

- ✅ Utilizza esclusivamente dati Tier-1 garantiti
- ✅ Non mostra più componenti con indici compositi (0-100) non direttamente derivati
- ✅ Ha trend grafici stabili senza crolli artificiali
- ✅ Ha fallback dati corretti (messaggi invece di "0,0,0")
- ✅ Ha fix UX per nomi eroi troncati

**Pronto per produzione:** ✅ SÌ

---

**Fine Report**

