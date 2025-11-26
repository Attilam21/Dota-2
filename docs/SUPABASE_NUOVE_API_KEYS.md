# 🔄 Supabase: Nuove API Keys (2024)

## ⚠️ IMPORTANTE: Supabase Ha Cambiato il Formato delle API Keys!

Supabase ha aggiornato il formato delle API keys. Ora usano un nuovo formato invece del vecchio JWT.

## 📋 Nuove API Keys in Supabase

### 1. Publishable Key (Pubblica)
**Nome in Vercel:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Formato Nuovo:**
```
sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSU8
```

**Formato Vecchio (JWT):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Dove trovarla:**
- Supabase Dashboard → Settings → API Keys
- Sezione "Publishable key"

**✅ Funziona allo stesso modo!** Il codice funziona con entrambi i formati.

---

### 2. Secret Key (Segreta)
**Nome in Vercel:** `SUPABASE_SERVICE_ROLE_KEY`

**Formato Nuovo:**
```
sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1
```

**Formato Vecchio:**
```
086c7592-55e0-41a9-b843-8cc6508ec7c7
```

**Dove trovarla:**
- Supabase Dashboard → Settings → API Keys
- Sezione "Secret keys" → "default"

**✅ Funziona allo stesso modo!** Il codice funziona con entrambi i formati.

---

## 🔧 Configurazione Vercel

### Variabili da Configurare:

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Valore: `https://yzfjtrteezvyoudpfccb.supabase.co`
   - Da: Supabase Dashboard → Settings → API → Project URL

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** ⭐ AGGIORNATA
   - Valore: `sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSU8`
   - Da: Supabase Dashboard → Settings → API Keys → Publishable key
   - **Formato nuovo:** Inizia con `sb_publishable_`

3. **`SUPABASE_URL`**
   - Valore: `https://yzfjtrteezvyoudpfccb.supabase.co`
   - Da: Supabase Dashboard → Settings → API → Project URL

4. **`SUPABASE_SERVICE_ROLE_KEY`** ⭐ AGGIORNATA
   - Valore: `sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1`
   - Da: Supabase Dashboard → Settings → API Keys → Secret keys → default
   - **Formato nuovo:** Inizia con `sb_secret_`

5. **`OPENDOTA_API_KEY`**
   - Valore: `086c7592-55e0-41a9-b843-8cc6508ec7c7`
   - Da: OpenDota Dashboard → Your Key

---

## ✅ Checklist Configurazione

### In Vercel Dashboard → Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://yzfjtrteezvyoudpfccb.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSU8` ⭐ NUOVO FORMATO
- [ ] `SUPABASE_URL` = `https://yzfjtrteezvyoudpfccb.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1` ⭐ NUOVO FORMATO
- [ ] `OPENDOTA_API_KEY` = `086c7592-55e0-41a9-b843-8cc6508ec7c7`

### Per ogni variabile:
- [ ] **Scope:** "All Environments" (Production, Preview, Development)
- [ ] **Valore:** Copia esatto da Supabase Dashboard
- [ ] **Salva** dopo ogni aggiunta

---

## 🔍 Come Trovare le Nuove Keys

1. **Vai su Supabase Dashboard**
2. **Settings** → **API Keys** (non "API" come prima!)
3. Trova:
   - **Publishable key** → Usa per `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Secret keys** → "default" → Usa per `SUPABASE_SERVICE_ROLE_KEY`

---

## ⚠️ Differenze Chiavi

| Tipo | Formato Vecchio | Formato Nuovo | Dove Usata |
|------|----------------|---------------|------------|
| Publishable | `eyJhbGci...` (JWT) | `sb_publishable_...` | Browser + Server |
| Secret | `086c7592-...` (UUID) | `sb_secret_...` | Solo Server |

**✅ Entrambi i formati funzionano!** Il codice Supabase supporta entrambi.

---

## 🎯 Dopo la Configurazione

1. **Aggiorna** le variabili in Vercel con le nuove keys
2. **Redeploy** il progetto
3. **Testa** login - dovrebbe funzionare

---

## 📝 Note

- Le nuove keys iniziano con `sb_publishable_` e `sb_secret_`
- Il codice funziona con entrambi i formati (vecchio e nuovo)
- Se hai ancora le vecchie keys, funzionano ancora
- Se hai le nuove keys, usale - sono più sicure

