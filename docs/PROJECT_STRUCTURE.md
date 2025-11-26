# Struttura Progetto Dota-2 Dashboard

## 📁 Struttura File Creata

```
Dota-2/
├── app/
│   ├── login/
│   │   └── page.tsx                    # Pagina login
│   ├── register/
│   │   └── page.tsx                     # Pagina registrazione
│   ├── onboarding/
│   │   ├── profile/
│   │   │   └── page.tsx                 # Step 1: Profilo
│   │   ├── avatar/
│   │   │   └── page.tsx                 # Step 2: Avatar
│   │   └── import/
│   │       └── page.tsx                 # Step 3: Import partite
│   ├── dashboard/
│   │   └── panoramica/
│   │       └── page.tsx                 # Dashboard principale (da creare)
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   └── onboarding/
│   │       ├── ProfileForm.tsx
│   │       ├── AvatarSelector.tsx
│   │       └── ImportMatchesForm.tsx
│   └── api/
│       └── opendota/                    # API routes esistenti
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # Client browser Supabase
│   │   └── server.ts                     # Client server Supabase
│   └── utils/
│       └── cn.ts                         # Utility classnames
│
├── supabase/
│   └── schema_complete.sql               # Schema database completo
│
├── middleware.ts                         # Middleware per auth routing
└── package.json                          # Dipendenze aggiornate

```

## 🔧 Modifiche Necessarie alle API Routes Esistenti

### 1. `/api/opendota/import-match/route.ts`
- Aggiungere supporto per `user_id` opzionale
- Salvare `user_id` quando presente

### 2. `/api/opendota/build-digest/route.ts`
- Aggiungere supporto per `user_id` opzionale
- Salvare `user_id` in `matches_digest` e `players_digest`

## 📋 Prossimi Step

1. ✅ Schema database creato
2. ✅ Login/Registrazione implementati
3. ✅ Onboarding flow completo
4. ⏳ Dashboard principale (panoramica)
5. ⏳ Componenti KPI e metriche
6. ⏳ Sezione coaching & tasks
7. ⏳ Analisi avanzate

## 🚀 Setup Iniziale

1. **Esegui schema SQL su Supabase:**
   ```sql
   -- Esegui supabase/schema_complete.sql nel SQL Editor di Supabase
   ```

2. **Aggiungi variabili d'ambiente:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Installa dipendenze:**
   ```bash
   npm install
   ```

4. **Testa il flusso:**
   - Registrazione → Onboarding → Dashboard

