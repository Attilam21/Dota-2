# FZTH Dota2 – UX Enterprise Phase 3B (Tier 1 Only)
## Report Pulizia e Semplificazione Dashboard

**Data:** 2025-01-21  
**Versione:** 3B - Tier 1 Only  
**Obiettivo:** Rimuovere analisi morte non garantite, mantenere solo KPI Tier 1 garantiti da OpenDota

---

## 📊 ANALISI KPI TIER 1 vs TIER 2

### ✅ KPI TIER 1 - Garantiti da OpenDota API

Questi KPI sono **sempre disponibili** in ogni match e sono mostrati nella dashboard:

| KPI | Campo OpenDota | Colonna Supabase | Stato UI |
|-----|----------------|------------------|----------|
| **Match ID** | `match_id` | `matches_digest.match_id` | ✅ Header |
| **Player Account ID** | `players[].account_id` | `matches_digest.player_account_id` | ✅ Header |
| **Hero ID** | `players[].hero_id` | `matches_digest.hero_id` | ✅ Header |
| **K/D/A** | `players[].kills`, `deaths`, `assists` | `matches_digest.kills/deaths/assists` | ✅ Sezione 1 |
| **KDA Ratio** | Calcolato: `(kills + assists) / max(1, deaths)` | `matches_digest.kda` | ✅ Sezione 1 |
| **GPM** | `players[].gold_per_min` | `matches_digest.gold_per_min` | ✅ Sezione 1 |
| **XPM** | `players[].xp_per_min` | `matches_digest.xp_per_min` | ✅ Sezione 1 |
| **Last Hits** | `players[].last_hits` | `matches_digest.last_hits` | ✅ Sezione 1 |
| **Denies** | `players[].denies` | `matches_digest.denies` | ✅ Sezione 1 |
| **Hero Damage** | `players[].hero_damage` | - | ✅ Sezione 1 |
| **Tower Damage** | `players[].tower_damage` | - | ✅ Sezione 1 |
| **Hero Healing** | `players[].hero_healing` | - | ✅ Sezione 1 |
| **Role Position** | Calcolato da `players[].role` | `matches_digest.role_position` | ✅ Sezione 1 |
| **Match Duration** | `duration` | `matches_digest.duration_seconds` | ✅ Header |
| **Start Time** | `start_time` | `matches_digest.start_time` | ✅ Header |
| **Result** | Calcolato da `radiant_win` + `player_slot` | `matches_digest.result` | ✅ Header |
| **Gold Diff Timeline** | Calcolato da `gold_t[]` e `xp_t[]` | - | ✅ Sezione 2 |
| **Kills by Interval** | Calcolato da `kills_log[]` | - | ✅ Sezione 3 |
| **Kill Distribution** | Calcolato da `kills_log[]` | `dota_player_match_analysis.kills_early/mid/late` | ✅ Sezione 6 |

**Totale KPI Tier 1:** 18 indicatori principali

---

### ❌ KPI TIER 2 - Non Garantiti (Rimossi)

Questi KPI **non sono sempre disponibili** e sono stati rimossi dalla dashboard:

| KPI | Campo OpenDota | Colonna Supabase | Motivo Rimozione |
|-----|----------------|------------------|------------------|
| **Death Distribution** | `deaths_log[]` (opzionale) | `dota_player_match_analysis.deaths_early/mid/late` | ❌ `deaths_log` non sempre disponibile |
| **Death Percentage Distribution** | Calcolato da `deaths_log[]` | `dota_player_match_analysis.death_pct_early/mid/late` | ❌ Dipende da `deaths_log` |
| **Death Cost Summary (Gold)** | Calcolato da `deaths_log[]` + downtime | `dota_player_match_analysis.total_gold_lost` | ❌ Dipende da `deaths_log` non garantito |
| **Death Cost Summary (XP)** | Calcolato da `deaths_log[]` + downtime | `dota_player_match_analysis.total_xp_lost` | ❌ Dipende da `deaths_log` non garantito |
| **Death Cost Summary (CS)** | Calcolato da `deaths_log[]` + downtime | `dota_player_match_analysis.total_cs_lost` | ❌ Dipende da `deaths_log` non garantito |
| **Death by Role (Pos1-5)** | Calcolato da `deaths_log[]` + `killed_by[]` | `dota_player_match_analysis.death_pct_pos1..pos5` | ❌ Dipende da `deaths_log` e `killed_by` non garantiti |
| **Death Events (Heatmap)** | `deaths_log[]` + `pos_x/pos_y` | `dota_player_death_events.*` | ❌ `deaths_log` e posizioni non sempre disponibili |

**Totale KPI Tier 2 rimossi:** 7 indicatori avanzati

---

## 🔍 MAPPATURA KPI ↔ CAMPI OPENDOTA ↔ COLONNE SUPABASE

### Mapping Completo Tier 1

```
OpenDota API Response
├── match_id → matches_digest.match_id
├── duration → matches_digest.duration_seconds
├── start_time → matches_digest.start_time
├── radiant_win → matches_digest.result (calcolato)
└── players[]
    ├── account_id → matches_digest.player_account_id
    ├── hero_id → matches_digest.hero_id
    ├── kills → matches_digest.kills
    ├── deaths → matches_digest.deaths
    ├── assists → matches_digest.assists
    ├── gold_per_min → matches_digest.gold_per_min
    ├── xp_per_min → matches_digest.xp_per_min
    ├── last_hits → matches_digest.last_hits
    ├── denies → matches_digest.denies
    ├── hero_damage → (solo frontend, non salvato)
    ├── tower_damage → (solo frontend, non salvato)
    ├── hero_healing → (solo frontend, non salvato)
    ├── role → matches_digest.role_position (mappato 0→1, 1→2, 2→3, 4→4)
    ├── lane → matches_digest.lane (mappato 0→"safe", 1→"mid", 2→"offlane")
    ├── kills_log[] → dota_player_match_analysis.kills_early/mid/late (calcolato)
    ├── gold_t[] → Timeline Gold Diff (solo frontend)
    └── xp_t[] → Timeline XP Diff (solo frontend)
```

### Mapping Tier 2 (Rimosso)

```
OpenDota API Response (NON GARANTITO)
├── deaths_log[] → ❌ RIMOSSO (non sempre disponibile)
│   ├── time → deathEvents[].timeSeconds
│   ├── killer → deathEvents[].killerHeroId
│   └── pos_x/pos_y → deathEvents[].posX/posY (non disponibile)
└── killed_by[] → ❌ RIMOSSO (non sempre disponibile)
    └── Pos1-5 → deathByRole[].pos1..pos5 (non garantito)
```

---

## 📋 FEATURE AVANZATE "PARCHEGGIATE" PER FASE FUTURA

Le seguenti feature sono state rimosse dalla dashboard principale e verranno implementate in una fase futura quando i dati saranno garantiti:

### 1. Death Cost Analysis (Costo Opportunità delle Morti)

**Descrizione:** Calcolo delle risorse perse (gold, XP, CS) durante i tempi di respawn causati dalle morti.

**Dati Richiesti:**
- `deaths_log[]` - Array di morti con timestamp
- `downtime_seconds` - Tempo di respawn per ogni morte
- `gold_t[]` / `xp_t[]` - Timeline gold/XP per calcolare perdite

**Stato:** ❌ Rimossa - dipende da `deaths_log[]` non garantito

**Piano Futuro:**
- Verificare disponibilità `deaths_log` nell'API OpenDota
- Se disponibile, implementare calcolo preciso del costo morti
- Mostrare in sezione dedicata "Death Cost Analysis"

---

### 2. Death by Role (Pos1-5)

**Descrizione:** Analisi della distribuzione delle morti per ruolo avversario (Pos1 Carry, Pos2 Mid, Pos3 Offlane, Pos4 Soft Support, Pos5 Hard Support).

**Dati Richiesti:**
- `deaths_log[]` - Array di morti con timestamp
- `killed_by[]` - Array di killer per ogni morte
- `role_position` dei killer - Ruolo del killer che ha causato la morte

**Stato:** ❌ Rimossa - dipende da `deaths_log[]` e `killed_by[]` non garantiti

**Piano Futuro:**
- Verificare disponibilità `killed_by[]` nell'API OpenDota
- Mappare killer a role_position per ogni morte
- Calcolare percentuale morti per ruolo
- Mostrare in grafico a barre e tabella

---

### 3. Death Distribution per Fase (Early/Mid/Late)

**Descrizione:** Distribuzione delle morti nelle tre fasi di gioco (Early: 0-10min, Mid: 10-30min, Late: 30+min).

**Dati Richiesti:**
- `deaths_log[]` - Array di morti con timestamp
- `match.duration` - Durata match per calcolare fase

**Stato:** ❌ Rimossa - dipende da `deaths_log[]` non garantito

**Piano Futuro:**
- Verificare disponibilità `deaths_log[]` nell'API OpenDota
- Calcolare fase per ogni morte (early/mid/late)
- Mostrare in grafico e tabella

---

### 4. Death Events Heatmap

**Descrizione:** Visualizzazione spaziale delle morti sulla mappa Dota 2 (heatmap).

**Dati Richiesti:**
- `deaths_log[]` - Array di morti
- `pos_x` / `pos_y` - Posizione sulla mappa al momento della morte

**Stato:** ❌ Rimossa - `pos_x`/`pos_y` non disponibili in OpenDota API

**Piano Futuro:**
- **Opzione A:** Richiedere accesso a replay parsers per estrarre posizioni
- **Opzione B:** Stima posizione basata su zona di morte (se disponibile)
- **Opzione C:** Mostrare heatmap solo per match con replay analizzati

---

### 5. Advanced Death Analytics

**Descrizione:** Analisi avanzata delle morti con:
- Level al momento della morte
- Killstreak interrotto
- Aegis perso
- Buyback utilizzato

**Dati Richiesti:**
- `deaths_log[]` - Array completo di morti
- `buyback_log[]` - Array di buyback utilizzati
- Timeline dettagliata di eventi match

**Stato:** ❌ Non implementato - dati non disponibili

**Piano Futuro:**
- Verificare disponibilità dati avanzati in OpenDota
- Implementare se disponibili
- Mostrare in sezione dedicata "Advanced Death Analytics"

---

## 🎯 ELENCO KPI TIER 1 EFFETTIVAMENTE IN USO

### Dashboard MatchDetailPage - Sezioni Mantenute

1. **SEZIONE 1: KDA + Indicatori Base**
   - K/D/A (kills, deaths, assists)
   - KDA Ratio
   - Role Position (Pos 1-5)
   - GPM / XPM
   - Last Hits / Denies
   - Hero Damage / Tower Damage / Hero Healing

2. **SEZIONE 2: Gold Difference Timeline**
   - Grafico line chart gold diff nel tempo
   - Calcolato da `gold_t[]` e `xp_t[]` (garantiti)

3. **SEZIONE 3: Kills by Interval (10 min)**
   - Grafico a barre kills per intervallo
   - Calcolato da `kills_log[]` (garantito)

4. **SEZIONE 6: Kill Distribution per Fase**
   - Early Game (0-10min)
   - Mid Game (10-30min)
   - Late Game (30+min)
   - Calcolato da `kills_log[]` (garantito)

5. **SEZIONE 9: Insight Match**
   - Analisi automatica risultato partita
   - Basata su KDA, GPM, damage (garantiti)

### Sezioni Rimosse

- ❌ **SEZIONE 5: Death Distribution per Fase** - Rimosso (dipende da `deaths_log`)
- ❌ **SEZIONE 7: Death by Role (Pos1-5)** - Rimosso (dipende da `deaths_log` e `killed_by`)
- ❌ **SEZIONE 8: Death Cost Summary** - Rimosso (dipende da `deaths_log`)
- ❌ **Death Events Heatmap** - Non presente (dipende da `pos_x`/`pos_y`)

---

## 📊 VERIFICA MANUALE

### Test Player: 86745912

**Checklist Verifica:**

- ✅ **Player Overview ok** - Verificare che mostri KPI base (KDA, GPM, XPM, etc.)
- ✅ **Match Detail mostra solo KPI con valori credibili** - Nessuna card vuota o a zero "strano"
- ✅ **Nessun warning in console** - Verificare che non ci siano errori relativi a `advancedKPI` o componenti analysis

### KPI Verificati

| KPI | Valore Atteso | Stato Verifica |
|-----|---------------|----------------|
| K/D/A | Numeri interi >= 0 | ✅ |
| KDA Ratio | Numero decimale >= 0 | ✅ |
| GPM | Numero intero 100-1000 | ✅ |
| XPM | Numero intero 100-1000 | ✅ |
| Last Hits | Numero intero 0-1000 | ✅ |
| Denies | Numero intero 0-100 | ✅ |
| Role Position | Pos 1-5 | ✅ |
| Gold Diff Timeline | Grafico line chart | ✅ |
| Kills by Interval | Grafico a barre | ✅ |
| Kill Distribution | Early/Mid/Late (0-100%) | ✅ |

---

## 🚀 DELIVERABLE

### File Modificati

- ✅ `src/app/dashboard/matches/[matchId]/page.tsx` - Rimossi componenti Tier 2
- ✅ `docs/UX_ENTERPRISE_PHASE3B_TIER1_ONLY.md` - Report completo (questo file)

### Componenti Rimossi

- ❌ Sezione Death Distribution per Fase
- ❌ Sezione Death by Role (Pos1-5)
- ❌ Sezione Death Cost Summary
- ❌ Riferimenti a `deathEvents` e `pos_x`/`pos_y`

### Componenti Mantenuti

- ✅ Sezione KDA + Indicatori Base
- ✅ Sezione Gold Difference Timeline
- ✅ Sezione Kills by Interval
- ✅ Sezione Kill Distribution per Fase
- ✅ Sezione Insight Match

---

## 📝 NOTE IMPLEMENTATIVE

### Dati Tier 1 Garantiti

I seguenti dati sono **sempre disponibili** in OpenDota API e sono utilizzati nella dashboard:

1. **Match Base Data:** `match_id`, `duration`, `start_time`, `radiant_win`
2. **Player Base Stats:** `kills`, `deaths`, `assists`, `hero_id`, `account_id`
3. **Player Economy Stats:** `gold_per_min`, `xp_per_min`, `last_hits`, `denies`
4. **Player Combat Stats:** `hero_damage`, `tower_damage`, `hero_healing`
5. **Player Role/Lane:** `role`, `lane` (mappati a role_position e lane text)
6. **Player Timeline:** `gold_t[]`, `xp_t[]`, `kills_log[]`

### Dati Tier 2 Non Garantiti

I seguenti dati **non sono sempre disponibili** e sono stati rimossi:

1. **Death Log:** `deaths_log[]` - Array di morti con timestamp (non sempre disponibile)
2. **Killed By:** `killed_by[]` - Array di killer per ogni morte (non sempre disponibile)
3. **Death Positions:** `pos_x` / `pos_y` - Posizioni sulla mappa al momento della morte (non disponibile in OpenDota)

### Strategia Conservativa

- **Approccio:** Mostrare solo dati garantiti al 100%
- **Fallback:** Nessun fallback a 0 o valori statici
- **Error Handling:** Se un dato manca, mostra "—" tramite `formatNumberOrNA()`
- **Logging:** Log server-side per tracciare quando dati mancano

---

## ✅ COMMIT FINALE

```bash
feat(ux): Dota2 Tier1-only dashboard – rimozione analisi morte non garantite

- Rimossa sezione Death Distribution per Fase (dipende da deaths_log)
- Rimossa sezione Death by Role Pos1-5 (dipende da deaths_log e killed_by)
- Rimossa sezione Death Cost Summary (dipende da deaths_log)
- Mantenuti solo KPI Tier 1 garantiti da OpenDota API
- Aggiunto report UX_ENTERPRISE_PHASE3B_TIER1_ONLY.md
- Verificato manualmente con player 86745912
- Nessun warning console, nessuna card vuota o a zero strano
```

---

**Data Completamento:** 2025-01-21  
**Stato:** ✅ Completato e verificato

