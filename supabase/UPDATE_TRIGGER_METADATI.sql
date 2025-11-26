-- SCRIPT PER AGGIORNARE IL TRIGGER handle_new_user()
-- Questo script modifica il trigger per leggere il nickname dai metadati utente
-- Pattern standard Supabase - Soluzione consigliata

-- Modifica la funzione trigger per leggere nickname da raw_user_meta_data
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

-- Il trigger è già creato, non serve ricrearlo
-- Verifica che esista:
-- SELECT trigger_name FROM information_schema.triggers 
-- WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';

