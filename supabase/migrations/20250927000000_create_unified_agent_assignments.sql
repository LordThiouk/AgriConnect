-- Migration: Création de la table unifiée agent_assignments
-- Objectif: Remplacer agent_producer_assignments par une table générique pour toutes les assignations

-- 1. Créer la nouvelle table agent_assignments
CREATE TABLE public.agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to_type TEXT NOT NULL CHECK (assigned_to_type IN ('producer', 'cooperative')),
  assigned_to_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(agent_id, assigned_to_type, assigned_to_id)
);

-- 2. Créer les index pour optimiser les performances
CREATE INDEX idx_agent_assignments_agent_id ON public.agent_assignments(agent_id);
CREATE INDEX idx_agent_assignments_assigned_to ON public.agent_assignments(assigned_to_type, assigned_to_id);
CREATE INDEX idx_agent_assignments_assigned_by ON public.agent_assignments(assigned_by);

-- 3. Migrer les données existantes depuis agent_producer_assignments
INSERT INTO public.agent_assignments (agent_id, assigned_to_type, assigned_to_id, assigned_at)
SELECT 
  agent_id, 
  'producer'::TEXT, 
  producer_id, 
  assigned_at
FROM public.agent_producer_assignments
ON CONFLICT (agent_id, assigned_to_type, assigned_to_id) DO NOTHING;

-- 4. Activer RLS sur la nouvelle table
ALTER TABLE public.agent_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS pour agent_assignments
-- Politique pour les agents : peuvent voir leurs propres assignations
CREATE POLICY "Agents can view their own assignments" ON public.agent_assignments
  FOR SELECT USING (
    agent_id = auth.uid() OR
    assigned_by = auth.uid()
  );

-- Politique pour les agents : peuvent créer leurs propres assignations (si assigned_by)
CREATE POLICY "Agents can create assignments" ON public.agent_assignments
  FOR INSERT WITH CHECK (
    assigned_by = auth.uid()
  );

-- Politique pour les agents : peuvent modifier leurs propres assignations
CREATE POLICY "Agents can update their assignments" ON public.agent_assignments
  FOR UPDATE USING (
    agent_id = auth.uid() OR
    assigned_by = auth.uid()
  );

-- Politique pour les agents : peuvent supprimer leurs propres assignations
CREATE POLICY "Agents can delete their assignments" ON public.agent_assignments
  FOR DELETE USING (
    agent_id = auth.uid() OR
    assigned_by = auth.uid()
  );

-- Politique pour les superviseurs et admins : accès complet
CREATE POLICY "Supervisors and admins have full access" ON public.agent_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('supervisor', 'admin')
    )
  );

-- 6. Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_agent_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_assignments_updated_at
  BEFORE UPDATE ON public.agent_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_assignments_updated_at();

-- 7. Ajouter des commentaires pour la documentation
COMMENT ON TABLE public.agent_assignments IS 'Table unifiée pour gérer toutes les assignations des agents (producteurs et coopératives)';
COMMENT ON COLUMN public.agent_assignments.assigned_to_type IS 'Type d''assignation: producer ou cooperative';
COMMENT ON COLUMN public.agent_assignments.assigned_to_id IS 'ID de l''entité assignée (producteur ou coopérative)';
COMMENT ON COLUMN public.agent_assignments.assigned_by IS 'Utilisateur qui a effectué l''assignation';

-- 8. Créer une vue pour faciliter les requêtes
CREATE VIEW public.agent_assignments_with_details AS
SELECT 
  aa.id,
  aa.agent_id,
  aa.assigned_to_type,
  aa.assigned_to_id,
  aa.assigned_at,
  aa.assigned_by,
  aa.created_at,
  aa.updated_at,
  
  -- Détails de l'agent
  p_agent.display_name as agent_name,
  p_agent.role as agent_role,
  
  -- Détails de l'entité assignée
  CASE 
    WHEN aa.assigned_to_type = 'producer' THEN CONCAT(p_producer.first_name, ' ', p_producer.last_name)
    WHEN aa.assigned_to_type = 'cooperative' THEN c.name
  END as assigned_to_name,
  
  -- Détails de l'utilisateur qui a assigné
  p_assigner.display_name as assigned_by_name

FROM public.agent_assignments aa
LEFT JOIN public.profiles p_agent ON aa.agent_id = p_agent.id
LEFT JOIN public.profiles p_assigner ON aa.assigned_by = p_assigner.id
LEFT JOIN public.producers p_producer ON aa.assigned_to_type = 'producer' AND aa.assigned_to_id = p_producer.id
LEFT JOIN public.cooperatives c ON aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = c.id;

-- Activer RLS sur la vue
ALTER VIEW public.agent_assignments_with_details SET (security_invoker = true);

-- 9. Ajouter des contraintes de validation
-- Vérifier que assigned_to_id correspond au bon type
CREATE OR REPLACE FUNCTION validate_agent_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que l'agent existe et a le bon rôle
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.agent_id 
    AND role = 'agent'
  ) THEN
    RAISE EXCEPTION 'L''agent doit avoir le rôle "agent"';
  END IF;
  
  -- Vérifier que assigned_to_id correspond au type
  IF NEW.assigned_to_type = 'producer' THEN
    IF NOT EXISTS (SELECT 1 FROM producers WHERE id = NEW.assigned_to_id) THEN
      RAISE EXCEPTION 'Le producteur assigné n''existe pas';
    END IF;
  ELSIF NEW.assigned_to_type = 'cooperative' THEN
    IF NOT EXISTS (SELECT 1 FROM cooperatives WHERE id = NEW.assigned_to_id) THEN
      RAISE EXCEPTION 'La coopérative assignée n''existe pas';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_agent_assignment
  BEFORE INSERT OR UPDATE ON public.agent_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_agent_assignment();

-- 10. Créer une fonction pour obtenir les statistiques des assignations
CREATE OR REPLACE FUNCTION get_agent_assignments_stats(p_agent_id UUID DEFAULT NULL)
RETURNS TABLE(
  total_assignments BIGINT,
  producer_assignments BIGINT,
  cooperative_assignments BIGINT,
  recent_assignments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_assignments,
    COUNT(*) FILTER (WHERE assigned_to_type = 'producer') as producer_assignments,
    COUNT(*) FILTER (WHERE assigned_to_type = 'cooperative') as cooperative_assignments,
    COUNT(*) FILTER (WHERE assigned_at >= NOW() - INTERVAL '30 days') as recent_assignments
  FROM public.agent_assignments aa
  WHERE (p_agent_id IS NULL OR aa.agent_id = p_agent_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
