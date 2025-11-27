# 🔑 Setup Completo Chiavi - Supabase → Vercel

## 📋 Lista Completa Chiavi Necessarie

### 1. **NEXT_PUBLIC_SUPABASE_URL** (URL del Progetto)

**In Supabase:**
- Vai su: **Settings** → **API** → **Project URL**
- Nome: "URL" o "Project URL"
- Valore: `https://yzfjtrteezvyoudpfccb.supabase.co`

**In Vercel:**
- Nome variabile: `NEXT_PUBLIC_SUPABASE_URL`
- Valore: `https://yzfjtrteezvyoudpfccb.supabase.co`
- Ambiente: ✅ Production, ✅ Preview, ✅ Development

---

### 2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (Chiave Pubblica/Anon)

**In Supabase:**
- Vai su: **Settings** → **API Keys** → **Publishable key**
- Nome: "Publishable key"
- Formato: `sb_publishable_...`
- Valore completo: `sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSUc8`
- ⚠️ **NOTA**: Questa chiave può essere condivisa pubblicamente (è sicura per il browser)

**In Vercel:**
- Nome variabile: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Valore: `sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSUc8`
- Ambiente: ✅ Production, ✅ Preview, ✅ Development
- ⚠️ **IMPORTANTE**: Deve iniziare con `NEXT_PUBLIC_` perché viene usata nel client-side

---

### 3. **SUPABASE_SERVICE_ROLE_KEY** (Chiave Privata/Service Role)

**In Supabase:**
- Vai su: **Settings** → **API Keys** → **Secret keys**
- Nome: "default" (o il nome che hai dato)
- Formato: `sb_secret_...`
- Valore completo: `sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1`
- ⚠️ **NOTA**: Questa chiave è PRIVATA e NON deve essere esposta nel browser!

**In Vercel:**
- Nome variabile: `SUPABASE_SERVICE_ROLE_KEY`
- Valore: `sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1`
- Ambiente: ✅ Production, ✅ Preview, ✅ Development
- ⚠️ **IMPORTANTE**: NON aggiungere `NEXT_PUBLIC_` (è privata, solo server-side)

---

### 4. **SUPABASE_URL** (URL per Server-Side)

**In Supabase:**
- Stesso valore di `NEXT_PUBLIC_SUPABASE_URL`
- Vai su: **Settings** → **API** → **Project URL**
- Valore: `https://yzfjtrteezvyoudpfccb.supabase.co`

**In Vercel:**
- Nome variabile: `SUPABASE_URL`
- Valore: `https://yzfjtrteezvyoudpfccb.supabase.co`
- Ambiente: ✅ Production, ✅ Preview, ✅ Development
- ⚠️ **NOTA**: Usata solo server-side (non ha `NEXT_PUBLIC_`)

---

### 5. **OPENDOTA_API_KEY** (Chiave OpenDota - Opzionale ma Consigliata)

**In OpenDota:**
- Vai su: https://www.opendota.com/api-keys
- Genera una nuova chiave API
- Valore: `086c7592-55e0-41a9-b843-8cc6508ec7c7` (esempio)

**In Vercel:**
- Nome variabile: `OPENDOTA_API_KEY`
- Valore: `086c7592-55e0-41a9-b843-8cc6508ec7c7`
- Ambiente: ✅ Production, ✅ Preview, ✅ Development
- ⚠️ **NOTA**: Opzionale ma consigliata per evitare rate limiting

---

## 🗑️ Chiavi da CANCELLARE (Se Presenti)

Se vedi queste variabili in Vercel, **CANCELLALE** (sono obsolete o errate):

- ❌ `SUPABASE_KEY` (nome generico, non specifico)
- ❌ `SUPABASE_ANON_KEY` (manca `NEXT_PUBLIC_`)
- ❌ Qualsiasi chiave che inizia con `eyJ...` (JWT vecchio, non più supportato)
- ❌ Qualsiasi chiave che NON corrisponde ai formati sopra

---

## ✅ Checklist Setup Vercel

### Step 1: Cancella Tutte le Variabili Esistenti
1. Vai su Vercel → **Settings** → **Environment Variables**
2. Per ogni variabile esistente, clicca sui **tre puntini** → **Delete**
3. Conferma la cancellazione

### Step 2: Aggiungi le Variabili Corrette (in Ordine)

#### Variabile 1: `NEXT_PUBLIC_SUPABASE_URL`
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://yzfjtrteezvyoudpfccb.supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development
- Clicca **Save**

#### Variabile 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSUc8`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development
- Clicca **Save**

#### Variabile 3: `SUPABASE_SERVICE_ROLE_KEY`
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `sb_secret_MXn13bKZDRXFja03b6HPtw_V5hdM0L1`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development
- Clicca **Save**

#### Variabile 4: `SUPABASE_URL`
- **Key**: `SUPABASE_URL`
- **Value**: `https://yzfjtrteezvyoudpfccb.supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development
- Clicca **Save**

#### Variabile 5: `OPENDOTA_API_KEY`
- **Key**: `OPENDOTA_API_KEY`
- **Value**: `086c7592-55e0-41a9-b843-8cc6508ec7c7`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development
- Clicca **Save**

### Step 3: Verifica
Dopo aver aggiunto tutte le variabili, verifica che siano esattamente 5:
1. ✅ `NEXT_PUBLIC_SUPABASE_URL`
2. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. ✅ `SUPABASE_SERVICE_ROLE_KEY`
4. ✅ `SUPABASE_URL`
5. ✅ `OPENDOTA_API_KEY`

### Step 4: Redeploy
1. Vai su **Deployments**
2. Clicca sui **tre puntini** dell'ultimo deployment
3. Seleziona **Redeploy**
4. Attendi che il build completi
5. Testa il login

---

## 🔍 Come Verificare le Chiavi in Supabase

### Per `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
1. Vai su Supabase Dashboard
2. **Settings** → **API Keys**
3. Sezione **"Publishable key"**
4. Copia il valore completo (inizia con `sb_publishable_`)

### Per `SUPABASE_SERVICE_ROLE_KEY`:
1. Vai su Supabase Dashboard
2. **Settings** → **API Keys**
3. Sezione **"Secret keys"**
4. Trova la chiave "default" (o quella che hai creato)
5. Clicca sull'icona **occhio** per vedere il valore completo
6. Copia il valore completo (inizia con `sb_secret_`)

### Per `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`:
1. Vai su Supabase Dashboard
2. **Settings** → **API** → **Data API**
3. Sezione **"Project URL"**
4. Copia l'URL completo (inizia con `https://`)

---

## ⚠️ Errori Comuni da Evitare

1. ❌ **Non usare il Legacy JWT Secret** come chiave API
   - Il JWT Secret è per la firma dei token, non per l'autenticazione API

2. ❌ **Non confondere `NEXT_PUBLIC_` vs senza `NEXT_PUBLIC_`**
   - `NEXT_PUBLIC_*` = accessibile nel browser (client-side)
   - Senza `NEXT_PUBLIC_` = solo server-side

3. ❌ **Non usare chiavi JWT vecchie** (`eyJ...`)
   - Le nuove chiavi iniziano con `sb_publishable_` o `sb_secret_`

4. ❌ **Non esporre `SUPABASE_SERVICE_ROLE_KEY` nel browser**
   - Non aggiungere mai `NEXT_PUBLIC_` a questa chiave!

---

## 📝 Note Finali

- ✅ Tutte le chiavi devono essere **esattamente** come mostrato sopra
- ✅ Controlla che non ci siano spazi o caratteri extra
- ✅ Dopo ogni modifica, fai sempre **Redeploy**
- ✅ Se qualcosa non funziona, verifica i log di Vercel per errori

---

## 🆘 Se Continua a Non Funzionare

1. Verifica che le chiavi in Vercel corrispondano **esattamente** a quelle in Supabase
2. Controlla i log di build di Vercel per errori
3. Verifica che tutte le 5 variabili siano presenti
4. Assicurati di aver fatto **Redeploy** dopo le modifiche

