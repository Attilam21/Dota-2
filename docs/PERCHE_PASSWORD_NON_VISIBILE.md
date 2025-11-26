# 🔒 Perché la Password Non è Visibile nella Tabella

## ✅ Comportamento Normale e Sicuro

**Le password NON sono mai memorizzate in chiaro** nella tabella `auth.users` di Supabase. Questo è un comportamento **normale e sicuro** di qualsiasi sistema di autenticazione moderno.

## 🔐 Come Funziona

### 1. Hash delle Password
- Quando crei un utente, la password viene **hashata** (criptata) usando algoritmi sicuri (bcrypt, argon2, ecc.)
- Solo l'**hash** viene memorizzato nel database
- La password originale **non può essere recuperata** dal database

### 2. Verifica Login
- Quando fai login, Supabase:
  1. Prende la password che inserisci
  2. La hasha con lo stesso algoritmo
  3. Confronta l'hash risultante con quello nel database
  4. Se corrispondono → login riuscito
  5. Se non corrispondono → errore "Invalid login credentials"

### 3. Perché Non Puoi Vedere la Password
- **Sicurezza**: Anche se qualcuno accede al database, non può vedere le password
- **Privacy**: Le password sono protette anche dagli amministratori
- **Best Practice**: Standard dell'industria per la sicurezza

## 🔍 Cosa Vedi nella Tabella `auth.users`

Nella tabella `auth.users` vedi:
- ✅ `id` - ID univoco utente
- ✅ `email` - Email utente
- ✅ `email_confirmed_at` - Data conferma email
- ✅ `created_at` - Data creazione
- ❌ **NON vedi la password** (è hashata e non recuperabile)

## 🔧 Cosa Fare Se Non Ricordi la Password

### Opzione 1: Reset Password (CONSIGLIATA)
1. Vai su Supabase Dashboard → Authentication → Users
2. Trova l'utente
3. Clicca "Send password reset email"
4. Controlla l'email e segui il link per resettare

**Nota**: Se email confirmation è disabilitata, potresti non ricevere l'email. In questo caso usa l'Opzione 2.

### Opzione 2: Elimina e Ricrea Utente (PER TEST)
1. Vai su Supabase Dashboard → Authentication → Users
2. Trova l'utente `attiliomazzetti@gmail.com`
3. Clicca sui tre puntini → **Delete user**
4. Vai su `/register` e registrati di nuovo
5. Usa una password che ricordi (es: `password123`)

### Opzione 3: Reset Password via SQL (NON POSSIBILE)
**Non puoi resettare la password via SQL** perché:
- La password è hashata
- Non puoi generare l'hash senza conoscere la password originale
- Supabase non espone funzioni per questo (per sicurezza)

## ✅ Conclusione

**È normale e sicuro** che non vedi la password nella tabella. Questo è il comportamento corretto di qualsiasi sistema di autenticazione moderno.

**Per i test:**
- Elimina e ricrea l'utente con una password che ricordi
- Oppure usa sempre la stessa password per i test (es: `password123`)

## 📚 Riferimenti

- Supabase Docs: https://supabase.com/docs/guides/auth/auth-password-reset
- Best Practices: Le password non devono mai essere memorizzate in chiaro

