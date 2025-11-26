# ✅ Soluzione Raccomandata - Registrazione Supabase

## 🎯 Problema

Il flusso attuale ha problemi di timing e sessione:
- Il trigger crea il profilo, ma la sessione non è disponibile per UPDATE
- Errori 401/403 durante UPDATE
- Dipendenza da delay/retry non affidabile

## 💡 Soluzione: Usare Metadati Utente

**Pattern standard Supabase** usato dalla maggior parte dei progetti open source.

### Come Funziona

1. **Durante signUp**, passa i dati come metadati:
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      nickname: nickname
    }
  }
});
```

2. **Il trigger legge i metadati** e crea il profilo completo:
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profile (
    id,
    nickname,
    onboarding_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', NULL),
    'profile_pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

3. **Nessun UPDATE necessario** - il profilo è completo subito!

## ✅ Vantaggi

- ✅ Nessun problema di timing (tutto in una transazione)
- ✅ Nessun problema di sessione (trigger usa SECURITY DEFINER)
- ✅ Pattern standard Supabase
- ✅ Più semplice e affidabile
- ✅ Usato da progetti open source

## 📋 Modifiche Necessarie

1. **RegisterForm.tsx**: Passa nickname nei metadati durante signUp
2. **Trigger SQL**: Leggi nickname dai metadati
3. **Rimuovi**: UPDATE dopo signUp (non più necessario)
4. **Rimuovi**: Endpoint API `/api/user/create-profile` (non più necessario)

## 🔄 Flusso Finale

```
1. signUp() con metadati → Crea utente in auth.users
2. Trigger esegue → Crea user_profile con nickname dai metadati
3. Redirect → /onboarding/profile
4. ✅ COMPLETO - Nessun UPDATE necessario!
```

## 📚 Riferimenti

- Pattern standard Supabase: https://supabase.com/docs/guides/auth/managing-user-data
- Usato da: La maggior parte dei progetti open source Supabase + Next.js

