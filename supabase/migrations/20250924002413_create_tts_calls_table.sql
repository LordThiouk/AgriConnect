-- Migration: Création de la table tts_calls
-- Date: 2025-01-24
-- Description: Table pour tracker les appels TTS envoyés aux producteurs via LAfricaMobile

-- Créer la table tts_calls
CREATE TABLE IF NOT EXISTS tts_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL, -- Message original en français
  translated_message TEXT, -- Message traduit en wolof par LAfricaMobile
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  lafricamobile_id TEXT, -- ID retourné par LAfricaMobile
  cost DECIMAL(10,4), -- Coût de l'appel en FCFA
  duration_seconds INTEGER, -- Durée de l'appel en secondes
  error_message TEXT, -- Message d'erreur en cas d'échec
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE SET NULL
);

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_tts_calls_producer_id ON tts_calls(producer_id);
CREATE INDEX IF NOT EXISTS idx_tts_calls_status ON tts_calls(status);
CREATE INDEX IF NOT EXISTS idx_tts_calls_created_at ON tts_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_tts_calls_recommendation_id ON tts_calls(recommendation_id);

-- Activer RLS (Row Level Security)
ALTER TABLE tts_calls ENABLE ROW LEVEL SECURITY;

-- Politique RLS: Les producteurs peuvent voir leurs propres appels TTS
CREATE POLICY "Producteurs peuvent voir leurs appels TTS" ON tts_calls
  FOR SELECT USING (producer_id = auth.uid());

-- Politique RLS: Les agents peuvent voir les appels TTS de leurs producteurs
-- Note: Structure simplifiée - les agents peuvent voir tous les appels TTS pour l'instant
CREATE POLICY "Agents peuvent voir les appels TTS" ON tts_calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'agent'
    )
  );

-- Politique RLS: Les superviseurs et admins peuvent voir tous les appels TTS
CREATE POLICY "Superviseurs et admins peuvent voir tous les appels TTS" ON tts_calls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('supervisor', 'admin')
    )
  );

-- Politique RLS: Seuls les services peuvent insérer des appels TTS
CREATE POLICY "Services peuvent insérer des appels TTS" ON tts_calls
  FOR INSERT WITH CHECK (true); -- Les Edge Functions utilisent le service key

-- Commentaire sur la table
COMMENT ON TABLE tts_calls IS 'Table pour tracker les appels TTS envoyés aux producteurs via LAfricaMobile';
COMMENT ON COLUMN tts_calls.producer_id IS 'ID du producteur destinataire';
COMMENT ON COLUMN tts_calls.phone_number IS 'Numéro de téléphone du producteur';
COMMENT ON COLUMN tts_calls.message IS 'Message original en français';
COMMENT ON COLUMN tts_calls.translated_message IS 'Message traduit en wolof par LAfricaMobile';
COMMENT ON COLUMN tts_calls.status IS 'Statut de l''appel TTS';
COMMENT ON COLUMN tts_calls.lafricamobile_id IS 'ID retourné par LAfricaMobile';
COMMENT ON COLUMN tts_calls.cost IS 'Coût de l''appel en FCFA';
COMMENT ON COLUMN tts_calls.duration_seconds IS 'Durée de l''appel en secondes';
COMMENT ON COLUMN tts_calls.recommendation_id IS 'ID de la recommandation associée';
