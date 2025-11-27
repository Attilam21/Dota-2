# 🎮 Piano: Funzionalità Demo Profilazione Giocatore

## 🎯 Obiettivo

Creare una funzionalità demo che permetta di:
1. Inserire un **account_id** (Steam ID) di un giocatore
2. Ottenere automaticamente l'**ultima partita** del giocatore da OpenDota
3. Importare la partita in Supabase
4. Creare il digest della partita
5. Mostrare il profilo del giocatore con i dati della partita

---

## 📋 Flusso Completo

### Step 1: Ottenere Ultima Partita da OpenDota
- **Endpoint OpenDota**: `GET /api/players/{account_id}/matches?limit=1`
- **Risposta**: Array di partite, prendiamo la prima (più recente)
- **Dati necessari**: `match_id` della partita

### Step 2: Importare la Partita
- **Endpoint nostro**: `GET /api/opendota/import-match?match_id={match_id}`
- **Azione**: Salva la partita raw in `raw_matches`

### Step 3: Creare il Digest
- **Endpoint nostro**: `POST /api/opendota/build-digest`
- **Body**: `{ match_id: number, user_id?: string }`
- **Azione**: Crea `matches_digest` e `players_digest`

### Step 4: Mostrare Profilo Giocatore
- Filtrare `players_digest` per `account_id`
- Mostrare statistiche del giocatore dalla partita

---

## 🔧 Implementazione

### Opzione A: Endpoint API Unico (Raccomandato)

**Endpoint**: `POST /api/demo/load-player-last-match`

**Body**:
```json
{
  "account_id": 123456789,
  "user_id": "optional-uuid" // opzionale, per associare a un utente
}
```

**Risposta**:
```json
{
  "status": "ok",
  "account_id": 123456789,
  "match_id": 789012345,
  "player_data": {
    "hero_id": 1,
    "kills": 10,
    "deaths": 5,
    "assists": 15,
    // ... altri dati del giocatore
  },
  "match_data": {
    "duration": 3600,
    "radiant_win": true,
    // ... altri dati della partita
  }
}
```

### Opzione B: Pagina Demo Interattiva

**Route**: `/demo/player/[account_id]`

**Funzionalità**:
- Input per inserire `account_id`
- Pulsante "Carica Ultima Partita"
- Mostra loading durante il processo
- Mostra risultati (statistiche giocatore, dettagli partita)

---

## 📝 Dettagli Tecnici

### API OpenDota per Ultima Partita

```typescript
// Endpoint: GET https://api.opendota.com/api/players/{account_id}/matches?limit=1
// Risposta: Array di match objects
// Prendiamo matches[0].match_id per ottenere l'ultima partita
```

### Flusso Chiamate

1. **Chiamata OpenDota** → Ottieni `match_id`
2. **Chiamata `/api/opendota/import-match`** → Importa partita
3. **Chiamata `/api/opendota/build-digest`** → Crea digest
4. **Query Supabase** → Ottieni dati giocatore da `players_digest`

---

## ✅ Vantaggi

- ✅ **Demo funzionante** senza bisogno di registrazione
- ✅ **Test rapido** della funzionalità
- ✅ **Mostra valore** dell'applicazione
- ✅ **Reutilizza** codice esistente (import-match, build-digest)

---

## 🎯 Prossimi Passi

1. Creare endpoint `/api/demo/load-player-last-match`
2. Implementare chiamata OpenDota per ultima partita
3. Integrare con import-match e build-digest esistenti
4. Creare pagina demo (opzionale)
5. Testare con account_id reale

---

## 🔗 Riferimenti

- [OpenDota API - Players Matches](https://docs.opendota.com/#tag/players%2Fpaths%2F~1players~1%7Baccount_id%7D~1matches%2Fget)
- Endpoint esistenti: `/api/opendota/import-match`, `/api/opendota/build-digest`

