# Audit Completo: From Zero To Hero – Dota 2

**Data:** 21 Novembre 2025
**Autore:** Antigravity (AI Agent)
**Stato:** Audit Completato

---

## 1. Mappa del Progetto

Il progetto è una dashboard Next.js (App Router) integrata con Supabase per la persistenza dei dati e OpenDota come fonte dati esterna.

### Struttura Cartelle Principali
- **`src/app/dashboard`**: Contiene le pagine e il layout della dashboard.
  - `page.tsx`: Panoramica principale (KPI, Eroi, Ultime partite).
  - `layout.tsx`: Layout con Sidebar e Header.
- **`src/app/api`**: Backend API (Route Handlers).
  - `fzth/sync-player`: Endpoint CRITICO per scaricare dati da OpenDota e popolare il DB.
  - `matches/list`: Endpoint per leggere le partite dal DB.
  - `players/list`: Endpoint per elencare i giocatori presenti nel DB.
- **`src/components`**: Componenti React.
  - `PlayerSelector.tsx`: Dropdown per selezionare il giocatore (header).
- **`src/lib`**: Logica di business e utility.
  - `utils/supabase.ts`: Client Supabase (SSR e Browser).
- **`supabase/migrations`**: Definizioni SQL del database.
  - `matches_digest`: Tabella principale per le partite.

---

## 2. Flusso Dati della Dashboard

### Flusso Inteso (Teorico)
1. **Sync**: Il sistema (o l'utente) invoca `/api/fzth/sync-player` -> Scarica dati da OpenDota -> Scrive su Supabase (`matches_digest`, `fzth_players`).
2. **List**: Dashboard chiama `/api/players/list` -> Legge da Supabase -> Popola il selettore giocatori.
3. **View**: Dashboard chiama `/api/matches/list` -> Legge da Supabase -> Visualizza grafici e tabelle.

### Flusso Attuale (Reale)
1. **Sync**: ❌ **NON AVVIENE MAI**. Nessun componente UI o script automatico chiama l'endpoint di sync.
2. **List**: Dashboard chiama `/api/players/list` -> Supabase è vuoto -> Ritorna lista vuota.
3. **View**: Dashboard chiama `/api/matches/list` -> Supabase è vuoto -> Ritorna lista vuota -> Dashboard mostra "Nessuna partita disponibile".

---

## 3. Perché la Dashboard non popola i dati?

La causa radice è l'**assenza di un meccanismo di innesco (trigger) per la sincronizzazione**.

1. **Database Vuoto**: Le tabelle `matches_digest` e `fzth_players` sono vuote perché nessuna migrazione inserisce dati di seed e nessuna azione utente popola il DB.
2. **Endpoint Orfano**: L'endpoint `/api/fzth/sync-player` contiene tutta la logica necessaria per scaricare i dati e popolare il DB, ma è **orfano**: non viene mai chiamato dal frontend.
3. **Circolo Vizioso**: Il componente `PlayerSelector` cerca giocatori esistenti nel DB. Se non ne trova, non offre l'opzione di aggiungerne uno nuovo, bloccando l'utente in uno stato vuoto.

---

## 4. API Analizzate

| Endpoint | File | Stato | Note |
|----------|------|-------|------|
| **`GET /api/fzth/sync-player`** | `src/app/api/fzth/sync-player/route.ts` | ✅ Funzionante (Logica) | Contiene la logica corretta di fetch da OpenDota e upsert su Supabase. **Mai chiamato.** |
| **`GET /api/matches/list`** | `src/app/api/matches/list/route.ts` | ✅ Funzionante | Legge correttamente da `matches_digest`. Ritorna array vuoto se DB vuoto. |
| **`GET /api/players/list`** | `src/app/api/players/list/route.ts` | ✅ Funzionante | Scansiona `matches_digest` per trovare giocatori unici. Ritorna vuoto se DB vuoto. |
| **`GET /api/fzth/player-summary`** | `src/app/api/fzth/player-summary/route.ts` | ⚠️ Rischio 404 | Cerca `fzth_players` per ID. Se il sync non è avvenuto, fallisce. |

---

## 5. Analisi Supabase e Query

### Tabelle Critiche
- **`matches_digest`**: Tabella centrale. Le migrazioni recenti (`20251121_...`) hanno aggiunto colonne mancanti e configurato RLS.
  - **RLS**: Configurato correttamente per permettere `SELECT` pubblico e `INSERT/UPDATE` solo al `service_role`.
- **`fzth_players`**: Tabella anagrafica giocatori. Popolata solo durante il sync.

### Punti Critici
- **Dipendenza da `matches_digest`**: L'API `players/list` deriva i giocatori scansionando `matches_digest`. Questo è inefficiente su grandi volumi, ma accettabile per ora. Il problema è che se `matches_digest` è vuota, non "vediamo" nemmeno i giocatori potenziali.

---

## 6. Analisi Frontend

- **`src/app/dashboard/page.tsx`**: Gestisce correttamente lo stato di caricamento e vuoto ("Nessuna partita disponibile"), ma non offre una "Call to Action" per risolvere il problema.
- **`src/components/PlayerSelector.tsx`**:
  - Logica: `fetch('/api/players/list')`.
  - Se la lista è vuota, mostra "Nessun giocatore trovato".
  - **Mancanza**: Non c'è un input text o un bottone per dire "Analizza Player ID 12345".

---

## 7. Top 5 Criticità e Soluzioni

| Priorità | Criticità | Descrizione | Soluzione Proposta |
|----------|-----------|-------------|--------------------|
| **1 (ALTA)** | **Mancanza Trigger Sync** | L'endpoint di sync non viene mai chiamato. Il DB rimane vuoto. | Aggiungere un pulsante o un form nella Dashboard (o nel `PlayerSelector`) per inserire un ID Dota e chiamare `/api/fzth/sync-player`. |
| **2 (ALTA)** | **UX Stato Vuoto** | L'utente atterra su una dashboard vuota senza istruzioni. | Modificare il messaggio "Nessuna partita" in `page.tsx` includendo un bottone "Sincronizza Dati Ora". |
| **3 (MEDIA)** | **Hardcoded Player ID** | `DEFAULT_PLAYER_ID` in `playerId.ts` punta a un ID che potrebbe non esistere nel DB locale. | Rimuovere il default hardcoded o assicurarsi che il sync venga lanciato per quell'ID al primo avvio. |
| **4 (MEDIA)** | **Gestione Errori Sync** | Se OpenDota fallisce o il DB è giù, l'utente non ha feedback (perché il sync non c'è). | Quando si implementa il bottone di sync, aggiungere toast/notifiche di successo/errore. |
| **5 (BASSA)** | **Performance Player List** | `players/list` scansiona tutta `matches_digest`. | Leggere dalla tabella `fzth_players` invece che aggregare `matches_digest`. |

---

## 8. Piano di Test Locale

Per verificare che le modifiche abbiano risolto il problema di popolamento dei dati, seguire questi passaggi:

1.  **Avvio Applicazione**: Eseguire `npm run dev` e navigare su `http://localhost:3000/dashboard`.
2.  **Verifica Stato Iniziale**:
    *   Se il database è vuoto, dovresti vedere il messaggio "Benvenuto nella dashboard Dota 2" e il pannello di sincronizzazione.
    *   Il selettore giocatori in alto a destra dovrebbe mostrare "Nessun giocatore. Sincronizza dati." o essere vuoto.
3.  **Esecuzione Sync**:
    *   Inserire un ID Dota 2 valido nel campo di input (es. `36771694` o `86745912`).
    *   Cliccare su "Sincronizza dati giocatore".
    *   Verificare che il pulsante mostri lo stato di caricamento ("Sincronizzazione in corso...").
4.  **Verifica Successo**:
    *   Attendere il messaggio di successo ("Sincronizzazione completata con successo!").
    *   La pagina dovrebbe ricaricarsi automaticamente.
    *   Dovrebbero apparire i dati del giocatore: KPI, grafici, lista partite.
    *   Il selettore giocatori dovrebbe ora mostrare il giocatore appena sincronizzato.
5.  **Verifica Errore**:
    *   Provare a inserire un ID non valido (es. `abc` o un numero negativo).
    *   Verificare che appaia un messaggio di errore appropriato e che l'applicazione non si blocchi.

---

## Conclusione

Il sistema è tecnicamente solido nel backend (API di sync e struttura DB sembrano corrette), ma è "scollegato" nel frontend. Manca il ponte che permette all'utente di avviare il popolamento dei dati.

**Prossimo passo raccomandato**: Implementare un componente UI "Sync Player" che invoca `/api/fzth/sync-player?playerId=...` e ricarica la pagina al termine.
