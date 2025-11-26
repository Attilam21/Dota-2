# 📋 Variabili d'Ambiente Vercel - Guida Completa

## ✅ Variabili Necessarie (5 totali)

### 1. `NEXT_PUBLIC_SUPABASE_URL` ⭐ OBBLIGATORIA
**Dove si trova in Supabase:**
- Dashboard → Settings → API → **Project URL**

**Valore esempio:**
```
https://yzfjtrteezvyoudpfccb.supabase.co
```

**Dove viene usata nel codice:**
- `lib/supabase/client.ts` (browser)
- `lib/supabase/server.ts` (server)
- `proxy.ts` (middleware)

**Nota:** `NEXT_PUBLIC_` significa che è esposta al browser (sicuro per URL)

---

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` ⭐ OBBLIGATORIA
**Dove si trova in Supabase:**
- Dashboard → Settings → API → **anon public** key

**Valore esempio:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Zmp0cnRlZXp2eW91ZHBmY2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDQwMDYsImV4cCI6MjA3OTEyMDAwNn0.sMWiigc2nb3KjSnco6mU5k0556ukRTcKS-3LDREtKIw
```

**Dove viene usata nel codice:**
- `lib/supabase/client.ts` (browser)
- `lib/supabase/server.ts` (server)
- `proxy.ts` (middleware)

**Nota:** `NEXT_PUBLIC_` significa che è esposta al browser (sicuro, è la chiave pubblica)

---

### 3. `SUPABASE_URL` ⭐ OBBLIGATORIA
**Dove si trova in Supabase:**
- Dashboard → Settings → API → **Project URL** (stesso di sopra)

**Valore esempio:**
```
https://yzfjtrteezvyoudpfccb.supabase.co
```

**Dove viene usata nel codice:**
- `lib/supabaseAdmin.ts` (server-side admin)
- `scripts/query-supabase.ts` (script locali)

**Nota:** Stesso valore di `NEXT_PUBLIC_SUPABASE_URL`, ma senza `NEXT_PUBLIC_` perché è solo server-side

---

### 4. `SUPABASE_SERVICE_ROLE_KEY` ⭐ OBBLIGATORIA
**Dove si trova in Supabase:**
- Dashboard → Settings → API → **service_role** key (ATTENZIONE: chiave segreta!)

**Valore esempio:**
```
086c7592-55e0-41a9-b843-8cc6508ec7c7
```

**Dove viene usata nel codice:**
- `lib/supabaseAdmin.ts` (server-side admin)
- `scripts/query-supabase.ts` (script locali)
- API routes che bypassano RLS

**⚠️ IMPORTANTE:** 
- NON ha `NEXT_PUBLIC_` perché è SEGRETA
- NON viene esposta al browser
- Usata solo server-side

---

### 5. `OPENDOTA_API_KEY` ⚪ OPCIONALE
**Dove si trova:**
- https://www.opendota.com/api-keys (registrati per ottenerla)

**Valore esempio:**
```
your-opendota-api-key-here
```

**Dove viene usata nel codice:**
- `app/api/opendota/import-match/route.ts`

**Nota:** Opzionale, ma consigliata per evitare rate limiting

---

## 📝 Checklist Configurazione Vercel

### In Vercel Dashboard → Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://yzfjtrteezvyoudpfccb.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGci...` (chiave anon pubblica)
- [ ] `SUPABASE_URL` = `https://yzfjtrteezvyoudpfccb.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `086c7592-55e0-41a9-b843-8cc6508ec7c7`
- [ ] `OPENDOTA_API_KEY` = `your-key` (opzionale)

### Per ogni variabile:
- [ ] **Scope:** Seleziona "All Environments" (Production, Preview, Development)
- [ ] **Valore:** Copia esatto da Supabase Dashboard
- [ ] **Salva** dopo ogni aggiunta

---

## 🔍 Come Trovare i Valori in Supabase

1. **Vai su Supabase Dashboard**
2. **Settings** → **API**
3. Trova:
   - **Project URL** → Usa per `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`
   - **anon public** → Usa per `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → Usa per `SUPABASE_SERVICE_ROLE_KEY` ⚠️ SEGRETO!

---

## ⚠️ Errori Comuni

### ❌ "No API key found in request"
**Causa:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` mancante o errata
**Fix:** Verifica che sia configurata correttamente in Vercel

### ❌ "Missing SUPABASE_URL"
**Causa:** `SUPABASE_URL` mancante (per admin/server)
**Fix:** Aggiungi `SUPABASE_URL` in Vercel

### ❌ "Missing SUPABASE_SERVICE_ROLE_KEY"
**Causa:** `SUPABASE_SERVICE_ROLE_KEY` mancante
**Fix:** Aggiungi `SUPABASE_SERVICE_ROLE_KEY` in Vercel

### ❌ Variabili non funzionano dopo aggiunta
**Causa:** Non hai fatto redeploy
**Fix:** Vai su Deployments → Redeploy

---

## 📊 Tabella Riassuntiva

| Nome Variabile | Tipo | Dove Usata | Obbligatoria |
|----------------|------|------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pubblica | Browser + Server | ✅ Sì |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pubblica | Browser + Server | ✅ Sì |
| `SUPABASE_URL` | Server | Solo Server | ✅ Sì |
| `SUPABASE_SERVICE_ROLE_KEY` | Segreta | Solo Server | ✅ Sì |
| `OPENDOTA_API_KEY` | Opzionale | API Routes | ⚪ No |

---

## ✅ Verifica Dopo Configurazione

1. **Aggiungi tutte le variabili** in Vercel
2. **Redeploy** il progetto
3. **Prova login** - non dovresti vedere "No API key"
4. **Controlla console** - non dovrebbero esserci errori di variabili mancanti

---

## 🎯 Ricorda

- `NEXT_PUBLIC_*` = Esposta al browser (pubblica)
- Senza `NEXT_PUBLIC_` = Solo server-side (può essere segreta)
- Dopo ogni modifica → **Redeploy necessario!**

