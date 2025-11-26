# 🔧 Fix "Invalid API key" - Step by Step

## 🔍 Problema Attuale

- ❌ Errore "Invalid API key" quando provi a fare login
- ❌ `401 Unauthorized` nella console
- ✅ Le variabili sono configurate in Vercel

## ✅ Soluzione Step-by-Step

### Step 1: Verifica Chiave Completa

**In Supabase Dashboard:**
1. Vai su **Settings** → **API Keys**
2. Trova **Publishable key**
3. **Clicca sull'icona "Copy"** per copiare la chiave completa
4. **Verifica** che la chiave inizi con `sb_publishable_` e sia completa

**Valore atteso (esempio):**
```
sb_publishable_A9RiwizmycqavABXqK_-7g_hzXiSU8
```

### Step 2: Aggiorna in Vercel

1. **Vai su Vercel Dashboard** → Il tuo progetto → **Settings** → **Environment Variables**
2. **Trova** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Clicca** per modificare
4. **Elimina** il valore attuale
5. **Incolla** la chiave completa da Supabase (Step 1)
6. **Verifica** che:
   - Non ci siano spazi all'inizio o alla fine
   - La chiave sia completa (non troncata)
   - Inizi con `sb_publishable_`
7. **Salva**

### Step 3: Redeploy OBBLIGATORIO

**IMPORTANTE:** Dopo ogni modifica alle variabili d'ambiente, devi fare redeploy!

1. **Vai su Vercel Dashboard** → **Deployments**
2. **Clicca** sui tre puntini del deployment più recente
3. **Clicca** "Redeploy"
4. **Attendi** che il deploy finisca

### Step 4: Verifica

1. **Vai su** `/login`
2. **Prova** a fare login
3. **Controlla** la console del browser:
   - Non dovresti vedere "Invalid API key"
   - Non dovresti vedere errori 401

## ⚠️ Errori Comuni

### ❌ Chiave Troncata
**Sintomo:** La chiave in Vercel è troncata (es: `sb_publishable_A9RiwizmycqavABXqK_-7g_hzXi...`)
**Fix:** Copia la chiave completa da Supabase

### ❌ Spazi Extra
**Sintomo:** Spazi all'inizio o alla fine della chiave
**Fix:** Elimina e ricopia la chiave senza spazi

### ❌ Non Hai Fatto Redeploy
**Sintomo:** Variabile aggiornata ma errore persiste
**Fix:** **Redeploy OBBLIGATORIO** dopo ogni modifica!

### ❌ Chiave Vecchia
**Sintomo:** Stai usando una chiave JWT vecchia (`eyJhbGci...`)
**Fix:** Usa la nuova chiave `sb_publishable_...` da API Keys

## 🔍 Verifica Chiave Corretta

### In Supabase Dashboard:
1. **Settings** → **API Keys** (non "API"!)
2. **Publishable key** → Dovrebbe essere `sb_publishable_...`
3. **Clicca Copy** per copiare completa

### In Vercel:
1. **Settings** → **Environment Variables**
2. **Trova** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Clicca** sull'icona occhio per vedere il valore
4. **Verifica** che sia identica a quella in Supabase

## 📝 Checklist Finale

- [ ] Chiave copiata completa da Supabase
- [ ] Chiave inizia con `sb_publishable_`
- [ ] Nessuno spazio extra
- [ ] Variabile aggiornata in Vercel
- [ ] Scope: "All Environments"
- [ ] **Redeploy eseguito** ⭐ OBBLIGATORIO
- [ ] Test login dopo redeploy

## 🎯 Se Ancora Non Funziona

1. **Controlla** la console del browser per errori dettagliati
2. **Verifica** che la versione di `@supabase/ssr` sia >= 0.5.0 (la tua è 0.5.2 ✅)
3. **Prova** a usare temporaneamente la chiave JWT vecchia (se disponibile)
4. **Contatta** supporto Supabase se il problema persiste

