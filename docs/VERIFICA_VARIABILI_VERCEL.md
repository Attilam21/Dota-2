# ✅ Verifica Variabili d'Ambiente Vercel

## 📋 Checklist Rapida

### Variabili OBBLIGATORIE (4):

1. ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - Valore: `https://yzfjtrteezvyoudpfccb.supabase.co`
   - Scope: All Environments

2. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Valore: `eyJhbGci...` (chiave anon pubblica)
   - Scope: All Environments

3. ✅ `SUPABASE_URL`
   - Valore: `https://yzfjtrteezvyoudpfccb.supabase.co`
   - Scope: All Environments

4. ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - Valore: `086c7592-55e0-41a9-b843-8cc6508ec7c7`
   - Scope: All Environments

### Variabili OPCIONALI (1):

5. ⚪ `OPENDOTA_API_KEY`
   - Valore: La tua chiave OpenDota
   - Scope: All Environments

---

## 🔍 Come Verificare in Vercel

1. Vai su **Vercel Dashboard** → **Il tuo progetto**
2. **Settings** → **Environment Variables**
3. Controlla che tutte e 4 le variabili obbligatorie siano presenti
4. Verifica che lo **Scope** sia "All Environments"

---

## ⚠️ Se Manca Qualcosa

1. **Aggiungi** la variabile mancante
2. **Salva**
3. **Redeploy** (Deployments → Redeploy)
4. **Testa** di nuovo

---

## 📝 Nomi Esatti (Copia e Incolla)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENDOTA_API_KEY
```

**⚠️ ATTENZIONE:** I nomi sono CASE-SENSITIVE! Copia esattamente come scritto sopra.

