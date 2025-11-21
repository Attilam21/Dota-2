# FZTH Dota2 – UX Enterprise Upgrade Fase 3A
## Report Analisi e Implementazione

**Data:** 2025-01-21  
**Versione:** 3A  
**Obiettivo:** Refactoring UX globale dashboard MatchDetailPage senza modificare logica dati/API/Supabase

---

## 📊 CHECKPOINT A – Analisi Pre-Intervento

### 1. Problemi UX Identificati

#### 1.1 Loading Experience
- ❌ **Problema:** Loading states con solo testo semplice ("Caricamento dati partita…")
- ❌ **Problema:** Nessun placeholder elegante o skeleton loader
- ❌ **Problema:** Flash visivo quando dati caricano
- ❌ **Problema:** Stato `kpiLoading` separato ma non sincronizzato con placeholder

**File Coinvolti:**
- `src/app/dashboard/matches/[matchId]/page.tsx` (linee 207-209, 258-264, 434-440)

#### 1.2 Branding FZTH
- ❌ **Problema:** Nessun logo FZTH visibile nella pagina
- ❌ **Problema:** Background image presente ma branding non evidente
- ❌ **Problema:** Palette colori non coerente con brand FZTH (blu petrolio/verde acqua/accenti arancioni)

**File Coinvolti:**
- `src/app/dashboard/matches/[matchId]/page.tsx` (header section)
- `src/app/dashboard/layout.tsx` (background già presente)

#### 1.3 Coerenza Spaziale
- ❌ **Problema:** Margini irregolari tra sezioni (spazio-y-6 vs spazio-y-4)
- ❌ **Problema:** Card con padding inconsistente (p-3 vs p-4)
- ❌ **Problema:** Griglie responsive non completamente allineate (md:grid-cols-2 vs lg:grid-cols-4)

**File Coinvolti:**
- `src/app/dashboard/matches/[matchId]/page.tsx` (tutte le sezioni)
- `src/components/dota/analysis/*.tsx` (card components)

#### 1.4 Pulizia Card
- ❌ **Problema:** Titoli con font size inconsistente (text-sm vs text-base vs text-lg)
- ❌ **Problema:** Testi ridondanti ("del totale", "Durante tutti i respawn")
- ❌ **Problema:** Nessuna icona coerente per hero/kill/death/gold/xp/cs
- ❌ **Problema:** Alcuni valori ancora usano fallback hardcoded (`?? '—'` invece di `formatValueOrNA`)

**File Coinvolti:**
- `src/app/dashboard/matches/[matchId]/page.tsx` (KPI Cards)
- `src/components/dota/analysis/DotaOverviewCard.tsx` (linee 129-130)
- `src/components/dota/analysis/DotaDeathCostSection.tsx`
- `src/components/dota/analysis/DotaKillDeathDistributionSection.tsx`

#### 1.5 Ottimizzazione Grafici
- ❌ **Problema:** Colori hardcoded non allineati palette FZTH (#22c55e, #ef4444, #f59e0b)
- ❌ **Problema:** Legend mancante o incoerente
- ❌ **Problema:** Label grafici non leggibili su background scuro
- ❌ **Problema:** Possibile overflow orizzontale su mobile

**File Coinvolti:**
- `src/app/dashboard/matches/[matchId]/page.tsx` (funzioni SparkLine, Bars)
- `src/components/dota/analysis/DotaKillDeathDistributionSection.tsx` (BarChart)

#### 1.6 Coerenza Semantica
- ❌ **Problema:** Ordine sezioni non standardizzato
- ❌ **Problema:** "Mini-analisi automatica" e "Analisi Avanzata Match FZTH" hanno contenuti sovrapposti
- ❌ **Problema:** Manca sezione "Insight Box" (placeholder fase 3C)

**File Coinvolti:**
- `src/app/dashboard/matches/[matchId]/page.tsx` (ordinamento sezioni)

---

### 2. Dataset Backend Verificato

✅ **Verificato:** Il dataset fornito dal backend è visualizzabile correttamente
- `DotaPlayerMatchAnalysis` ha tutti i campi necessari
- `formatNumberOrNA()` e `formatPercentageOrNA()` gestiscono correttamente null/undefined
- Mapping backend → frontend funziona correttamente

---

## 🎯 PIANO IMPLEMENTAZIONE FILE-PER-FILE

### FASE 1: Stabilizzazione Layout

**File: `src/app/dashboard/matches/[matchId]/page.tsx`**

**Modifiche:**
1. Standardizzare `space-y-6` per tutte le sezioni principali
2. Standardizzare padding card: `p-4` per tutte le card principali
3. Creare costanti palette colori FZTH (blu petrolio #0d9488, verde acqua #14b8a6, arancione #f97316)
4. Riordinare sezioni secondo schema richiesto:
   - Header con logo FZTH (opzionale)
   - KDA + Indicatori base
   - Gold/XP/CS timeline (grafico)
   - Kills by interval (grafico)
   - Advanced KPI (collapse/expand?)
   - Death Distribution
   - Kill Distribution
   - Death by Role
   - Death Cost Summary
   - Insight Box (placeholder)

**Componenti Nuovi:**
- `components/ui/SkeletonLoader.tsx` - Skeleton loader riutilizzabile
- `components/ui/FZTHLogo.tsx` - Logo FZTH leggero (opzionale)

---

### FASE 2: Miglioramento Grafici

**File: `src/app/dashboard/matches/[matchId]/page.tsx` (funzioni SparkLine, Bars)**

**Modifiche:**
1. Aggiornare colori grafici a palette FZTH:
   - Team: verde acqua #14b8a6
   - Nemico: rosso #ef4444
   - Neutral: blu petrolio #0d9488
2. Aggiungere legend coerente
3. Migliorare label leggibilità (stroke outline bianco su background scuro)
4. Fix overflow orizzontale (max-width, overflow-hidden)

---

### FASE 3: Branding FZTH

**File: `src/app/dashboard/matches/[matchId]/page.tsx` (header)**

**Modifiche:**
1. Aggiungere logo FZTH piccolo nell'header (opzionale, se disponibile)
2. Aggiornare palette colori card a tonalità FZTH:
   - Success/Positive: verde acqua #14b8a6
   - Warning/Neutral: arancione #f97316
   - Error/Negative: rosso #ef4444
   - Info/Background: blu petrolio #0d9488

**File: `src/components/ui/FZTHLogo.tsx` (nuovo)**

**Implementazione:**
- Componente logo FZTH leggero (SVG o testo stilizzato)
- Props: `size` (sm, md, lg), `variant` (light, dark)

---

### FASE 4: Loading UX Refinements

**File: `src/app/dashboard/matches/[matchId]/page.tsx`**

**Modifiche:**
1. Sostituire loading text con skeleton loaders
2. Aggiungere placeholder per ogni sezione principale
3. Garantire che `setKpiLoading(false)` sia sempre in `finally`
4. Aggiungere transizione smooth quando dati caricano

**File: `src/components/ui/SkeletonLoader.tsx` (nuovo)**

**Implementazione:**
- Skeleton loader generico con varianti (card, text, chart)
- Animazione pulse elegante

---

### FASE 5: Clean-up Finale

**File: Tutti i componenti Dota 2**

**Modifiche:**
1. Rimuovere testi ridondanti
2. Standardizzare font sizes (titoli: text-lg font-semibold, labels: text-xs text-neutral-400)
3. Aggiungere icone coerenti (hero, kill, death, gold, xp, cs) dove possibile
4. Rimuovere fallback hardcoded rimanenti
5. Verificare che tutti i valori usino `formatNumberOrNA()` o `formatPercentageOrNA()`

---

## 📋 CHECKPOINT B – Verifica Post-Intervento

### Verifiche Automatiche

1. **Nessun valore "0" quando non deve:**
   - ✅ Usa `isValueMissing()` per verificare valori realmente null
   - ✅ Mostra "—" solo quando valore è realmente null/undefined/NaN

2. **Nessun blocco vuoto:**
   - ✅ Tutte le sezioni hanno placeholder durante loading
   - ✅ Sezione nascosta solo se `advancedKPI === null` e non in loading

3. **Grafici non vanno in overflow:**
   - ✅ Grafici con `max-w-full overflow-hidden`
   - ✅ SVG con `viewBox` responsive

4. **Layout simmetrico:**
   - ✅ Tutte le card usano stesso padding `p-4`
   - ✅ Tutte le griglie usano stesso gap `gap-4`

5. **UX non presenta salti o flickering:**
   - ✅ Transizioni smooth tra loading e dati
   - ✅ Placeholder mantiene altezza approssimativa del contenuto finale

---

## 🎨 PALETTE COLORI FZTH (Proposta)

```typescript
const FZTH_COLORS = {
  // Primary
  teal: {
    primary: '#14b8a6', // Verde acqua (success, positive)
    dark: '#0d9488',    // Blu petrolio (info, background)
  },
  // Accents
  orange: '#f97316',    // Arancione (warning, neutral)
  red: '#ef4444',       // Rosso (error, negative)
  // Neutral
  neutral: {
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
}
```

**Mapping Uso:**
- Team/Success: `FZTH_COLORS.teal.primary` (#14b8a6)
- Info/Background: `FZTH_COLORS.teal.dark` (#0d9488)
- Warning/Neutral: `FZTH_COLORS.orange` (#f97316)
- Error/Negative: `FZTH_COLORS.red` (#ef4444)

---

## 📁 FILE DA MODIFICARE (Checklist)

### File Principali
- [ ] `src/app/dashboard/matches/[matchId]/page.tsx` - **PRIORITÀ ALTA**
- [ ] `src/components/dota/analysis/DotaOverviewCard.tsx` - **PRIORITÀ MEDIA**
- [ ] `src/components/dota/analysis/DotaDeathCostSection.tsx` - **PRIORITÀ MEDIA**
- [ ] `src/components/dota/analysis/DotaKillDeathDistributionSection.tsx` - **PRIORITÀ MEDIA**
- [ ] `src/components/dota/analysis/DotaDeathByRoleSection.tsx` - **PRIORITÀ MEDIA**

### File Nuovi (Opzionali)
- [ ] `src/components/ui/SkeletonLoader.tsx` - Skeleton loader riutilizzabile
- [ ] `src/components/ui/FZTHLogo.tsx` - Logo FZTH (opzionale)
- [ ] `src/utils/fzthColors.ts` - Palette colori FZTH

### File Utilità
- [ ] `src/utils/dotaFormatting.ts` - Verificare che tutte le utility siano utilizzate correttamente

---

## 🚀 PROSSIMO STEP

**Attendo conferma per procedere con l'implementazione file-per-file secondo il piano sopra.**

Ogni fase verrà implementata separatamente con commit dedicato per facilitare il rollback se necessario.

