# ✅ Configurazione Vercel - Valori Esatti dalle Tue Screenshot

## 📋 Variabili da Configurare in Vercel

### 1. `NEXT_PUBLIC_SUPABASE_URL`
**Valore:**
```
https://yzfjtrteezvyoudpfccb.supabase.co
```
**Dove trovarla:**
- Supabase Dashboard → Settings → Data API → Project URL

---

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` ⭐ NUOVO FORMATO
**Valore:**
```
sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSU8
```
**Dove trovarla:**
- Supabase Dashboard → Settings → API Keys → **Publishable key**
- **Formato nuovo:** Inizia con `sb_publishable_`

---

### 3. `SUPABASE_URL`
**Valore:**
```
https://yzfjtrteezvyoudpfccb.supabase.co
```
**Dove trovarla:**
- Supabase Dashboard → Settings → Data API → Project URL
- **Stesso valore** di `NEXT_PUBLIC_SUPABASE_URL`

---

### 4. `SUPABASE_SERVICE_ROLE_KEY` ⭐ NUOVO FORMATO
**Valore:**
```
sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1
```
**Dove trovarla:**
- Supabase Dashboard → Settings → API Keys → **Secret keys** → "default"
- **Formato nuovo:** Inizia con `sb_secret_`

---

### 5. `OPENDOTA_API_KEY`
**Valore:**
```
086c7592-55e0-41a9-b843-8cc6508ec7c7
```
**Dove trovarla:**
- OpenDota Dashboard → Your Key

---

## 🔧 Step-by-Step in Vercel

1. **Vai su Vercel Dashboard** → Il tuo progetto → **Settings** → **Environment Variables**

2. **Per ogni variabile:**
   - Clicca **"Add New"**
   - **Nome:** Copia esattamente il nome (case-sensitive!)
   - **Valore:** Copia esattamente il valore dalle screenshot
   - **Environment:** Seleziona "All Environments" (Production, Preview, Development)
   - **Salva**

3. **Redeploy:**
   - Vai su **Deployments**
   - Clicca sui tre puntini del deployment più recente
   - Clicca **Redeploy**

---

## ✅ Checklist Finale

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://yzfjtrteezvyoudpfccb.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSU8`
- [ ] `SUPABASE_URL` = `https://yzfjtrteezvyoudpfccb.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1`
- [ ] `OPENDOTA_API_KEY` = `086c7592-55e0-41a9-b843-8cc6508ec7c7`
- [ ] Tutte le variabili hanno scope "All Environments"
- [ ] Redeploy eseguito
- [ ] Test login dopo redeploy

---

## ⚠️ Errori Comuni

### ❌ "No API key found"
**Causa:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` mancante o errata
**Fix:** Verifica che sia `sb_publishable_...` (nuovo formato)

### ❌ "Invalid login credentials" (dopo fix variabili)
**Causa:** Password errata, non problema di variabili
**Fix:** Elimina e ricrea utente con password nota

### ❌ Variabili non funzionano
**Causa:** Non hai fatto redeploy
**Fix:** Deployments → Redeploy

---

## 🎯 Dopo la Configurazione

1. **Redeploy** il progetto
2. **Prova login** - non dovresti vedere "No API key"
3. Se vedi "Invalid login credentials" → password errata, elimina e ricrea utente

