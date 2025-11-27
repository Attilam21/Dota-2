# 🔑 Istruzioni: Chiave API Ricevuta

## Chiave Ricevuta

```
q6OnPXVU2cfohjOP6pN7J1/LO0wKwbTbss0Z8a12fvT7O/PXSC8wG8vGv7kF206sXV1jWgj9viS8iK9dn7RrLA==
```

## 📋 Cosa Fare

### Step 1: Verifica in Supabase Dashboard

1. Vai su **Supabase Dashboard** → **Settings** → **API**
2. Cerca questa chiave tra:
   - **anon/public key** (per client-side)
   - **service_role key** (per server-side)
   - **sb_publishable_...** (nuove chiavi)
   - **sb_secret_...** (nuove chiavi)

### Step 2: Identifica il Tipo di Chiave

**Se è la chiave `anon/public`:**
- Usa come `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel

**Se è la chiave `service_role`:**
- Usa come `SUPABASE_SERVICE_ROLE_KEY` in Vercel
- ⚠️ **NON** usare come `NEXT_PUBLIC_*` (è privata!)

**Se è una nuova chiave `sb_publishable_...`:**
- Potrebbe essere la nuova versione della chiave anon
- Usa come `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel

### Step 3: Configura in Vercel

1. Vai su **Vercel Dashboard** → **Settings** → **Environment Variables**
2. **Se è la chiave anon:**
   - Variabile: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Valore: `q6OnPXVU2cfohjOP6pN7J1/LO0wKwbTbss0Z8a12fvT7O/PXSC8wG8vGv7kF206sXV1jWgj9viS8iK9dn7RrLA==`
   - Ambiente: ✅ Production, ✅ Preview, ✅ Development

3. **Se è la chiave service_role:**
   - Variabile: `SUPABASE_SERVICE_ROLE_KEY`
   - Valore: `q6OnPXVU2cfohjOP6pN7J1/LO0wKwbTbss0Z8a12fvT7O/PXSC8wG8vGv7kF206sXV1jWgj9viS8iK9dn7RrLA==`
   - Ambiente: ✅ Production, ✅ Preview, ✅ Development
   - ⚠️ **NON** aggiungere `NEXT_PUBLIC_` (è privata!)

### Step 4: Redeploy

1. Dopo aver aggiunto/modificato la variabile, fai **Redeploy** su Vercel
2. Attendi che il build completi
3. Testa il login

### Step 5: Verifica

1. Apri l'app in produzione
2. Prova a fare login
3. Apri **Network tab** nel browser
4. Controlla la richiesta a `/auth/v1/token`
5. Verifica che l'header `apikey` sia presente e contenga questa chiave

## ⚠️ Note Importanti

- ✅ **Non committare** questa chiave nel repository
- ✅ Usa **solo variabili d'ambiente** in Vercel
- ✅ Verifica che sia la chiave **corretta** (anon vs service_role)
- ✅ Se è una chiave **temporanea**, rigenerala dopo il test

## 🔍 Se Non Funziona

1. **Verifica formato:**
   - Controlla se la chiave inizia con `sb_publishable_` o `sb_secret_`
   - Se inizia con `eyJ...`, è una chiave JWT vecchia

2. **Verifica corrispondenza:**
   - Confronta con quella in Supabase Dashboard
   - Assicurati che siano identiche (carattere per carattere)

3. **Verifica variabile:**
   - Controlla che la variabile in Vercel sia esattamente:
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (per client-side)
     - `SUPABASE_SERVICE_ROLE_KEY` (per server-side)

4. **Redeploy:**
   - Fai sempre redeploy dopo aver modificato le variabili
   - Pulisci la cache se necessario

## 📞 Supporto

Se continua a non funzionare:
1. Verifica i log di Vercel per errori
2. Controlla la console del browser per errori
3. Verifica che la chiave sia corretta in Supabase Dashboard

