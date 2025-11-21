-- Migration: crea tabella dota_tasks per il sistema di Task Dota 2
-- Data: 2025-11-25

CREATE TABLE IF NOT EXISTS dota_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'failed')),
  kpi_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_dota_tasks_player_id ON dota_tasks(player_id);
CREATE INDEX IF NOT EXISTS idx_dota_tasks_status ON dota_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dota_tasks_player_status ON dota_tasks(player_id, status);
CREATE INDEX IF NOT EXISTS idx_dota_tasks_type ON dota_tasks(type);
CREATE INDEX IF NOT EXISTS idx_dota_tasks_created_at ON dota_tasks(created_at DESC);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_dota_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dota_tasks_updated_at
  BEFORE UPDATE ON dota_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_dota_tasks_updated_at();

-- Commenti per documentazione
COMMENT ON TABLE dota_tasks IS 'Tabella per i Task di coaching Dota 2 generati automaticamente dai KPI';
COMMENT ON COLUMN dota_tasks.player_id IS 'Account ID Dota 2 (Steam32) del giocatore';
COMMENT ON COLUMN dota_tasks.type IS 'Tipo di Task (es. REDUCE_EARLY_DEATHS, INCREASE_KP, ecc.)';
COMMENT ON COLUMN dota_tasks.status IS 'Stato del Task: open, completed, failed';
COMMENT ON COLUMN dota_tasks.kpi_payload IS 'Snapshot JSON dei KPI usati per generare il Task';
COMMENT ON COLUMN dota_tasks.params IS 'Parametri del Task (soglie, target, ecc.)';

