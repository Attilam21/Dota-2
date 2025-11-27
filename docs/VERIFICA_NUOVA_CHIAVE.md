# 🔑 Verifica Nuova Chiave API

## Chiave Ricevuta

```
q6OnPXVU2cfohjOP6pN7J1/LO0wKwbTbss0Z8a12fvT7O/PXSC8wG8vGv7kF206sXV1jWgj9viS8iK9dn7RrLA==
```

## 📊 Analisi Formato

### Caratteristiche:
- ✅ Lunghezza: 88 caratteri
- ✅ Contiene caratteri base64: `A-Z`, `a-z`, `0-9`, `+`, `/`, `=`
- ✅ Termina con `==` (padding base64)
- ✅ Formato simile a chiave crittografata o codificata

### Possibili Tipi:
1. **Chiave API Supabase codificata** (base64)
2. **Chiave crittografata** che richiede decodifica
3. **Token di autenticazione** temporaneo

## 🔍 Verifica

### 1. Verifica se è Base64 Valido

La stringa sembra essere in formato base64. Potrebbe essere:
- Una chiave API codificata
- Una chiave crittografata
- Un token

### 2. Confronto con Formati Supabase

**Formato Vecchio (JWT):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Formato Nuovo (sb_publishable):**
```
sb_publishable_...
```

**Formato Service Role:**
```
sb_secret_...
```

### 3. Possibile Decodifica Base64

Se è base64, potrebbe contenere:
- Una chiave API in formato testo
- Dati crittografati
- Un token

## ✅ Come Usare

### Opzione 1: Chiave API Diretta

Se questa è una chiave API valida, aggiungila a Vercel:

1. Vai su Vercel Dashboard → Settings → Environment Variables
2. Aggiungi/modifica:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `q6OnPXVU2cfohjOP6pN7J1/LO0wKwbTbss0Z8a12fvT7O/PXSC8wG8vGv7kF206sXV1jWgj9viS8iK9dn7RrLA==`
3. Fai redeploy

### Opzione 2: Chiave Decodificata

Se è base64, potrebbe essere necessario decodificarla:

```javascript
// In Node.js o browser console
const decoded = atob('q6OnPXVU2cfohjOP6pN7J1/LO0wKwbTbss0Z8a12fvT7O/PXSC8wG8vGv7kF206sXV1jWgj9viS8iK9dn7RrLA==');
console.log(decoded);
```

### Opzione 3: Verifica in Supabase Dashboard

1. Vai su Supabase Dashboard → Settings → API
2. Confronta questa chiave con quelle mostrate
3. Verifica se corrisponde a:
   - **anon/public key** (per client-side)
   - **service_role key** (per server-side)

## 🎯 Prossimi Passi

1. **Verifica in Supabase Dashboard** se questa chiave corrisponde a una delle chiavi mostrate
2. **Aggiungi a Vercel** come `NEXT_PUBLIC_SUPABASE_ANON_KEY` se è la chiave anon
3. **Fai redeploy** e testa il login
4. **Controlla Network tab** per verificare se l'header `apikey` viene inviato correttamente

## ⚠️ Note di Sicurezza

- ✅ Non committare questa chiave nel repository
- ✅ Usa solo variabili d'ambiente
- ✅ Verifica che sia la chiave corretta (anon vs service_role)
- ✅ Se è una chiave temporanea, rigenerala dopo il test

