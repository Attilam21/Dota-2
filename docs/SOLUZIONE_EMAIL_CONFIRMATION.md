# 📧 Soluzione: Email di Conferma Non Arriva

## 🔍 Problema

L'email di conferma non arriva dopo la registrazione. Questo è comune quando:
- Email confirmation è abilitata in Supabase
- Le impostazioni SMTP non sono configurate
- L'email va nello spam
- Il servizio email di Supabase ha limiti

## ✅ Soluzioni

### Soluzione 1: Disabilitare Email Confirmation (CONSIGLIATA PER SVILUPPO)

**Per sviluppo e test, la soluzione più semplice è disabilitare email confirmation:**

1. **Vai su Supabase Dashboard**
2. **Authentication → Settings**
3. **Trova "Enable email confirmations"**
4. **Disabilita** (toggle OFF)
5. **Salva**

**Dopo questa modifica:**
- Gli utenti possono fare login immediatamente dopo la registrazione
- Non serve confermare l'email
- Perfetto per sviluppo e test

### Soluzione 2: Configurare SMTP Personalizzato

**Se vuoi mantenere email confirmation ma usare un servizio email personalizzato:**

1. **Vai su Supabase Dashboard**
2. **Settings → Auth → SMTP Settings**
3. **Configura un servizio SMTP:**
   - Gmail (con App Password)
   - SendGrid
   - Mailgun
   - AWS SES
   - Altri servizi SMTP

**Configurazione esempio (Gmail):**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: [App Password di Gmail]
Sender Email: your-email@gmail.com
Sender Name: FZTH Dota 2
```

### Soluzione 3: Verificare Email nello Spam

**Controlla:**
- Cartella Spam/Promozioni
- Filtri email
- Blocchi email

### Soluzione 4: Usare Email di Test

**Per test, puoi:**
- Usare servizi email temporanei (mailinator, 10minutemail)
- Verificare che l'email sia valida in Supabase Dashboard → Authentication → Users

## 🎯 Raccomandazione per Sviluppo

**Disabilita email confirmation** durante lo sviluppo:

1. ✅ Più veloce per testare
2. ✅ Nessun problema con email che non arrivano
3. ✅ Puoi riabilitarla in produzione quando serve

## 📝 Script SQL per Verificare Configurazione

Puoi verificare se email confirmation è abilitata con:

```sql
-- Verifica configurazione auth
SELECT 
  name,
  value
FROM auth.config
WHERE name LIKE '%email%';
```

## 🔧 Modifica Codice (Opzionale)

Se disabiliti email confirmation, puoi semplificare `RegisterForm.tsx`:

```typescript
if (authData.user) {
  // Se email confirmation è disabilitata, authData.session sarà presente
  if (authData.session) {
    // Login automatico dopo registrazione
    router.push('/onboarding/profile');
  } else {
    // Email confirmation richiesta (ma disabilitata, quindi non dovrebbe arrivare qui)
    setError('Controlla la tua email per confermare l\'account...');
  }
}
```

## ✅ Prossimi Step

1. **Vai su Supabase Dashboard**
2. **Authentication → Settings**
3. **Disabilita "Enable email confirmations"**
4. **Salva**
5. **Prova a registrarti di nuovo**
6. **Dovresti poter fare login immediatamente**

## 📚 Riferimenti

- Supabase Docs: https://supabase.com/docs/guides/auth/auth-email-templates
- SMTP Configuration: https://supabase.com/docs/guides/auth/auth-smtp

