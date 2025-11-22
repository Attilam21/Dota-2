# Performance & Stile di Gioco - Enterprise Profile Module

## Obiettivo

Trasformare la sezione "Performance e Stile di Gioco" in un modulo ENTERPRISE che descrive in modo oggettivo come gioca il player, usando SOLO dati reali presenti in Supabase / OpenDota, senza metriche fittizie o basate su telemetrie non disponibili.

## Architettura UX

La sezione è strutturata in 4 blocchi principali, tutti basati su dati reali:

### BLOCCO 1 – Profilo di Gioco (4 card sintetiche)

Quattro card orizzontali che descrivono lo stile del player:

1. **Aggressività** (0-100)
2. **Efficienza Farm** (0-100)
3. **Macro Gameplay** (0-100)
4. **Stabilità (Consistency)** (0-100)

### BLOCCO 2 – Trend di Stile (grafico multiplo)

Grafico a linee sulle ultime N partite che mostra l'evoluzione dei 3 indici:
- Aggressività (giallo/arancio)
- Farm Efficiency (verde)
- Macro Gameplay (blu)

### BLOCCO 3 – KPI per Fase (Early / Mid / Late)

Tre mini-card che mostrano i KPI per fase di gioco:
- **Early Game (0-10 min)**: Avg Kills, Avg Deaths (se disponibile)
- **Mid Game (10-30 min)**: Avg Kills, Avg Deaths (se disponibile)
- **Late Game (30+ min)**: Avg Kills, Avg Deaths (se disponibile)

### BLOCCO 4 – Insight Testuali

2-3 righe di insight statici basati su semplici condizioni sui KPI reali.

## Formule Implementate

### 1. Indice Aggressività (0-100)

**Metriche utilizzate:**
- KP (Kill Participation): `(kills + assists) / (kills + deaths + assists)`
- Fight Rate: `(kills + assists) / duration_minutes`
- KDA: `(kills + assists) / max(1, deaths)`

**Normalizzazione:**
Ogni metrica viene normalizzata su scala 0-1 rispetto a min/max nelle ultime N partite del player stesso.

**Formula:**
```
norm_kp = (avg_kp - min_kp) / (max_kp - min_kp || 1)
norm_fr = (avg_fr - min_fr) / (max_fr - min_fr || 1)
norm_kda = (avg_kda - min_kda) / (max_kda - min_kda || 1)

aggressiveness_index = 100 * (0.4 * norm_kp + 0.4 * norm_fr + 0.2 * norm_kda)
```

**Interpretazione:**
- < 40: "Stile tendenzialmente passivo"
- 40-70: "Stile equilibrato"
- > 70: "Stile molto aggressivo"

### 2. Indice Efficienza Farm (0-100)

**Metriche utilizzate:**
- GPM (Gold Per Minute): da `matches_digest.gold_per_min`
- LHPM (Last Hits Per Minute): `last_hits / duration_minutes`

**Normalizzazione:**
Ogni metrica viene normalizzata su scala 0-1 rispetto a min/max nelle ultime N partite del player stesso.

**Formula:**
```
norm_gpm = (avg_gpm - min_gpm) / (max_gpm - min_gpm || 1)
norm_lhpm = (avg_lhpm - min_lhpm) / (max_lhpm - min_lhpm || 1)

farm_index = 100 * (0.7 * norm_gpm + 0.3 * norm_lhpm)
```

**Interpretazione:**
- < 40: "Farm sotto la media delle tue partite"
- 40-70: "Farm nella media"
- > 70: "Farm sopra la tua media abituale"

### 3. Indice Macro Gameplay (0-100)

**Metriche utilizzate:**
- Late Focus: `kills_late / max(1, kills_early + kills_mid + kills_late)` (da `dota_player_match_analysis`)
- Mid Focus: `kills_mid / max(1, kills_early + kills_mid + kills_late)` (da `dota_player_match_analysis`)
- GPM: normalizzato rispetto alle proprie partite

**Normalizzazione:**
Ogni metrica viene normalizzata su scala 0-1 rispetto a min/max nelle ultime N partite del player stesso.

**Formula:**
```
norm_mid = (avg_mid_focus - min_mid_focus) / (max_mid_focus - min_mid_focus || 1)
norm_late = (avg_late_focus - min_late_focus) / (max_late_focus - min_late_focus || 1)
norm_gpm = (avg_gpm - min_gpm) / (max_gpm - min_gpm || 1)

macro_index = 100 * (0.4 * norm_mid + 0.4 * norm_late + 0.2 * norm_gpm)
```

**Interpretazione:**
- < 40: "Macro da migliorare (impatto concentrato early)"
- 40-70: "Macro nella media"
- > 70: "Buon impatto mid/late game"

### 4. Indice Stabilità (Consistency) (0-100)

**Metriche utilizzate:**
- Deviazione standard KDA
- Deviazione standard GPM
- Deviazione standard XPM

**Soglie massime (hard-coded, documentate):**
- `MAX_STD_KDA = 2.0`
- `MAX_STD_GPM = 200`
- `MAX_STD_XPM = 200`

**Formula:**
```
std_kda = std_dev(kdas)
std_gpm = std_dev(gpms)
std_xpm = std_dev(xpms)

stability_kda = clamp(100 * (1 - std_kda / MAX_STD_KDA), 0, 100)
stability_gpm = clamp(100 * (1 - std_gpm / MAX_STD_GPM), 0, 100)
stability_xpm = clamp(100 * (1 - std_xpm / MAX_STD_XPM), 0, 100)

consistency_index = round((stability_kda + stability_gpm + stability_xpm) / 3)
```

**Interpretazione:**
- < 40: "Prestazioni molto altalenanti"
- 40-70: "Stabilità discreta"
- > 70: "Stile di gioco consistente"

### 5. KPI per Fase

**Calcolo:**
Per ogni fase (Early/Mid/Late), calcola la media dei kill/morti sulle ultime N partite che hanno analysis data disponibile.

**Fonte dati:**
- `dota_player_match_analysis.kills_early/mid/late`
- Death data non disponibile in Tier 1 (sempre `null`)

### 6. Insight Testuali

**Regole implementate:**

1. **Aggressività bassa + Farm alto:**
   - "Farming solido ma bassa partecipazione ai fight. Valuta di essere più presente nei combattimenti chiave."

2. **Aggressività alta + Farm basso:**
   - "Molto presente ai fight ma farm inefficiente. Rischi di arrivare in late senza risorse sufficienti."

3. **Macro alta (≥ 70):**
   - "Buona gestione di mid e late game: sfrutti i vantaggi per chiudere prima le partite."

4. **Consistency molto bassa (< 40):**
   - "Prestazioni altalenanti: alterni partite molto buone a partite negative. Lavora sulla ripetibilità delle performance."

5. **Consistency alta (≥ 70):**
   - "Profilo stabile: le tue partite hanno performance simili. Puoi concentrare il lavoro su piccoli miglioramenti mirati."

**Massimo 3 bullet point sintetici.**

## Campi DB Utilizzati

### Tabelle Supabase

1. **matches_digest**
   - `match_id`, `player_account_id`
   - `kills`, `deaths`, `assists`
   - `duration_seconds`, `start_time`, `result`
   - `gold_per_min`, `xp_per_min`, `last_hits`, `denies`

2. **dota_player_match_analysis**
   - `match_id`, `account_id`
   - `kills_early`, `kills_mid`, `kills_late`

### API Endpoints

- **GET /api/performance/profile?playerId={id}&limit={n}**
  - Ritorna array di `MatchWithAnalysis[]`
  - Carica da `matches_digest` (priorità) o OpenDota (fallback)
  - Combina con `dota_player_match_analysis` per kills per fase

### Fallback Logic

- Se `matches_digest` non ha dati, usa OpenDota (`/players/{id}/recentMatches`)
- Se `dota_player_match_analysis` non ha dati per un match, quel match non avrà analysis data (opzionale)
- Se non ci sono dati sufficienti (< 1 partita), mostra messaggio "Dati insufficienti per calcolare il profilo di gioco"

## Limitazioni Note

1. **Death data per fase:** Non disponibile in Tier 1. I campi `avgDeaths` per fase sono sempre `null`.

2. **Team kills:** Non disponibile direttamente. KP viene calcolato come proxy usando solo i dati del player.

3. **Tower/Roshan participation:** Non disponibile in Tier 1. Non utilizzato nei calcoli.

4. **CS al minuto 10:** Non disponibile in Tier 1. Non utilizzato nei calcoli.

5. **Normalizzazione relativa:** Tutti gli indici sono normalizzati rispetto alle proprie partite, non assoluti. Un player può avere un indice alto anche se oggettivamente è scarso, se è coerente con le sue prestazioni storiche.

## Componenti UI

### File Struttura

```
src/components/dota/performance/
├── PerformanceProfileCards.tsx      # BLOCCO 1: 4 card sintetiche
├── PerformanceStyleTrend.tsx        # BLOCCO 2: Grafico trend multiplo
├── PerformancePhaseKPI.tsx          # BLOCCO 3: KPI per fase
└── PerformanceInsights.tsx          # BLOCCO 4: Insight testuali
```

### Pagina Principale

**File:** `src/app/dashboard/performance/page.tsx`

**Flusso dati:**
1. Carica overview KPI (per grafico Performance Aggregata esistente)
2. Carica performance profile (`/api/performance/profile`)
3. Calcola profilo usando `calculatePlayerPerformanceProfile()`
4. Renderizza i 4 blocchi enterprise

## Estensioni Future

Quando avremo dati garantiti per:

1. **Death events per fase:** Aggiungere `avgDeaths` per fase in BLOCCO 3
2. **Tower/Roshan participation:** Aggiungere metriche macro più accurate
3. **CS al minuto 10:** Aggiungere metrica early game farm più precisa
4. **Team kills:** Sostituire proxy KP con KP reale

## Testing

**Player di test:** `86745912`

**Verifiche:**
1. Gli indici hanno valori diversi da 0/100 e coerenti col dataset
2. Il trend mostra andamento non piatto
3. Le frasi di insight sono coerenti con i numeri visualizzati
4. Nessun crash o errore console per dati mancanti

## Commit

```
feat(performance): Enterprise Performance & Style Profile module (Tier-1 only)
```

