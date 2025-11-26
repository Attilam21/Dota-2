# 🔧 Troubleshooting Autenticazione - Errori 401/403

## ✅ RLS Policies Verificate

Le RLS policies sono configurate correttamente:
- ✅ INSERT: `WITH CHECK (auth.uid() = id)`
- ✅ UPDATE: `USING (auth.uid() = id)` + `WITH CHECK (auth.uid() = id)`
- ✅ SELECT: `USING (auth.uid() = id)`

## 🔍 Possibili Cause Errori 401/403

### 1. **Sessione Non Valida**
L'utente potrebbe non essere autenticato correttamente quando fa la richiesta.

**Verifica:**
```javascript
// Nella console del browser
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

### 2. **Cookie Non Inviati**
I cookie di autenticazione potrebbero non essere inviati correttamente.

**Verifica:**
- Apri DevTools → Application → Cookies
- Cerca cookie che iniziano con `sb-` o `supabase.auth.token`
- Verifica che siano presenti e non scaduti

### 3. **Variabili d'Ambiente Mancanti**
Le variabili d'ambiente potrebbero non essere configurate su Vercel.

**Verifica su Vercel:**
- Settings → Environment Variables
- Deve avere:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 4. **Trigger Non Eseguito**
Il trigger `handle_new_user()` potrebbe non essere eseguito in tempo.

**Soluzione già implementata:**
- Delay di 1 secondo prima dell'UPDATE
- Fallback con INSERT se UPDATE fallisce

### 5. **Problema con SECURITY DEFINER**
Il trigger usa `SECURITY DEFINER`, quindi bypassa RLS. Ma quando il client fa UPDATE, deve passare attraverso RLS.

**Verifica:**
```sql
-- Verifica che il trigger esista
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

## 🔧 Soluzioni

### Soluzione 1: Verifica Sessione
Aggiungi questo nel `RegisterForm` dopo `signUp`:

```typescript
// Dopo signUp, verifica la sessione
const { data: { session } } = await supabase.auth.getSession();
console.log('[RegisterForm] Session:', session);

if (!session) {
  // La sessione potrebbe non essere ancora disponibile
  // Aspetta un po' e riprova
  await new Promise(resolve => setTimeout(resolve, 2000));
  const { data: { session: retrySession } } = await supabase.auth.getSession();
  console.log('[RegisterForm] Retry session:', retrySession);
}
```

### Soluzione 2: Usa Service Role per Creazione Profilo
In alternativa, crea un endpoint API che usa `supabaseAdmin`:

```typescript
// app/api/user/create-profile/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const { userId, nickname } = await request.json();
  
  const { error } = await supabaseAdmin
    .from('user_profile')
    .upsert({
      id: userId,
      nickname,
      onboarding_status: 'profile_pending',
    }, { onConflict: 'id' });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
```

### Soluzione 3: Verifica Cookie Settings
Assicurati che i cookie siano configurati correttamente in Supabase:
- Dashboard → Authentication → URL Configuration
- Verifica che "Site URL" e "Redirect URLs" siano corretti

## 🧪 Test Step-by-Step

1. **Pulisci tutto:**
   - Cookie del browser
   - LocalStorage
   - SessionStorage

2. **Apri DevTools:**
   - Console tab
   - Network tab
   - Application → Cookies

3. **Registra nuovo utente:**
   - Monitora la console per errori
   - Monitora Network per richieste 401/403
   - Verifica che i cookie vengano creati

4. **Verifica sessione:**
   ```javascript
   // Nella console
   const supabase = createClient();
   const { data: { user, session } } = await supabase.auth.getUser();
   console.log('User:', user);
   console.log('Session:', session);
   ```

5. **Testa UPDATE:**
   ```javascript
   // Nella console
   const { error } = await supabase
     .from('user_profile')
     .update({ nickname: 'test' })
     .eq('id', user.id);
   console.log('Update error:', error);
   ```

## 📊 Log da Controllare

Quando vedi un errore 401/403, controlla:

1. **Console Browser:**
   - `[RegisterForm]` o `[ProfileForm]` logs
   - Errori di autenticazione

2. **Network Tab:**
   - Status code (401, 403)
   - Request headers (contiene Authorization?)
   - Response body (messaggio errore)

3. **Supabase Logs:**
   - Dashboard → Logs → API Logs
   - Cerca richieste fallite

## ✅ Checklist

- [ ] RLS policies configurate correttamente
- [ ] Trigger `handle_new_user()` attivo
- [ ] Variabili d'ambiente configurate su Vercel
- [ ] Cookie vengono creati dopo signUp
- [ ] Sessione valida dopo signUp
- [ ] `auth.uid()` restituisce l'ID corretto

