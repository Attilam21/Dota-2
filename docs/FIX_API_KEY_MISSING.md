# 🔧 Fix: "No API key found in request"

## 🔍 Problema

Errore quando provi a fare login:
```json
{
  "message": "No API key found in request",
  "hint": "No `apikey` request header or url param was found."
}
```

**Causa:** Le variabili d'ambiente di Supabase non sono configurate in Vercel.

## ✅ Soluzione: Configurare Variabili d'Ambiente in Vercel

### Step 1: Trova le Chiavi Supabase

1. Vai su **Supabase Dashboard** → **Settings** → **API**
2. Trova:
   - **Project URL**: `https://yzfjtrteezvyoudpfccb.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (chiave lunga)

### Step 2: Configura in Vercel

1. Vai su **Vercel Dashboard** → **Il tuo progetto** → **Settings** → **Environment Variables**

2. Aggiungi queste variabili:

   **Nome:** `NEXT_PUBLIC_SUPABASE_URL`  
   **Valore:** `https://yzfjtrteezvyoudpfccb.supabase.co`  
   **Environment:** Production, Preview, Development (seleziona tutti)

   **Nome:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   **Valore:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Zmp0cnRlZXp2eW91ZHBmY2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDQwMDYsImV4cCI6MjA3OTEyMDAwNn0.sMWiigc2nb3KjSnco6mU5k0556ukRTcKS-3LDREtKIw`  
   **Environment:** Production, Preview, Development (seleziona tutti)

   **Nome:** `SUPABASE_URL`  
   **Valore:** `https://yzfjtrteezvyoudpfccb.supabase.co`  
   **Environment:** Production, Preview, Development (seleziona tutti)

   **Nome:** `SUPABASE_SERVICE_ROLE_KEY`  
   **Valore:** `086c7592-55e0-41a9-b843-8cc6508ec7c7` (la tua service role key)  
   **Environment:** Production, Preview, Development (seleziona tutti)

3. **Salva** le variabili

4. **Redeploy** il progetto:
   - Vai su **Deployments**
   - Clicca sui tre puntini del deployment più recente
   - Clicca **Redeploy**

### Step 3: Verifica

Dopo il redeploy:
1. Vai su `/login`
2. Prova a fare login
3. Dovrebbe funzionare senza errori "No API key"

## 🔍 Verifica Variabili d'Ambiente

### In Vercel Dashboard:
1. Settings → Environment Variables
2. Verifica che tutte le variabili siano presenti
3. Verifica che siano selezionate per tutti gli environment (Production, Preview, Development)

### Nel Codice:
Le variabili sono usate in:
- `lib/supabase/client.ts` - Usa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `lib/supabase/server.ts` - Usa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `lib/supabaseAdmin.ts` - Usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ Note Importanti

1. **`NEXT_PUBLIC_*`** significa che queste variabili sono esposte al client (browser)
   - ✅ Sicuro per `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chiave pubblica)
   - ❌ NON esporre mai `SUPABASE_SERVICE_ROLE_KEY` (è privata!)

2. **Redeploy necessario**: Dopo aver aggiunto/modificato variabili d'ambiente, devi fare redeploy

3. **Verifica URL**: Assicurati che l'URL di Supabase sia corretto (senza trailing slash)

## 📝 Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurata in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurata in Vercel
- [ ] `SUPABASE_URL` configurata in Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurata in Vercel
- [ ] Tutte le variabili selezionate per Production, Preview, Development
- [ ] Redeploy eseguito
- [ ] Test login dopo redeploy

## ✅ Dopo la Configurazione

Una volta configurate le variabili e fatto il redeploy:
1. Il login dovrebbe funzionare
2. La registrazione dovrebbe funzionare
3. Non dovresti più vedere errori "No API key"

