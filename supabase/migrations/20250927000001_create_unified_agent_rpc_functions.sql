-- Migration: Création des nouvelles RPC functions pour la table unifiée agent_assignments
-- Objectif: Remplacer les anciennes fonctions utilisant agent_producer_assignments

-- 1. Fonction pour assigner un agent à une coopérative
CREATE OR REPLACE FUNCTION assign_agent_to_cooperative(
  p_agent_id UUID,
  p_cooperative_id UUID,
  p_assigned_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'agent existe et a le bon rôle
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_agent_id 
    AND role = 'agent'
  ) THEN
    RAISE EXCEPTION 'L''agent doit avoir le rôle "agent"';
  END IF;
  
  -- Vérifier que la coopérative existe
  IF NOT EXISTS (
    SELECT 1 FROM cooperatives 
    WHERE id = p_cooperative_id
  ) THEN
    RAISE EXCEPTION 'La coopérative n''existe pas';
  END IF;
  
  -- Créer l'assignation
  INSERT INTO agent_assignments (agent_id, assigned_to_type, assigned_to_id, assigned_by)
  VALUES (p_agent_id, 'cooperative', p_cooperative_id, p_assigned_by)
  ON CONFLICT (agent_id, assigned_to_type, assigned_to_id) DO NOTHING;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction pour assigner un agent à un producteur
CREATE OR REPLACE FUNCTION assign_agent_to_producer(
  p_agent_id UUID,
  p_producer_id UUID,
  p_assigned_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'agent existe et a le bon rôle
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_agent_id 
    AND role = 'agent'
  ) THEN
    RAISE EXCEPTION 'L''agent doit avoir le rôle "agent"';
  END IF;
  
  -- Vérifier que le producteur existe
  IF NOT EXISTS (
    SELECT 1 FROM producers 
    WHERE id = p_producer_id
  ) THEN
    RAISE EXCEPTION 'Le producteur n''existe pas';
  END IF;
  
  -- Créer l'assignation
  INSERT INTO agent_assignments (agent_id, assigned_to_type, assigned_to_id, assigned_by)
  VALUES (p_agent_id, 'producer', p_producer_id, p_assigned_by)
  ON CONFLICT (agent_id, assigned_to_type, assigned_to_id) DO NOTHING;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour récupérer toutes les assignations d'un agent
CREATE OR REPLACE FUNCTION get_agent_assignments(p_agent_id UUID)
RETURNS TABLE(
  assignment_id UUID,
  assignment_type TEXT,
  assignment_name TEXT,
  assigned_at TIMESTAMPTZ,
  assigned_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id as assignment_id,
    aa.assigned_to_type as assignment_type,
    CASE 
      WHEN aa.assigned_to_type = 'producer' THEN CONCAT(p.first_name, ' ', p.last_name)
      WHEN aa.assigned_to_type = 'cooperative' THEN c.name
    END as assignment_name,
    aa.assigned_at,
    p_assigner.display_name as assigned_by_name
  FROM agent_assignments aa
  LEFT JOIN producers p ON aa.assigned_to_type = 'producer' AND aa.assigned_to_id = p.id
  LEFT JOIN cooperatives c ON aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = c.id
  LEFT JOIN profiles p_assigner ON aa.assigned_by = p_assigner.id
  WHERE aa.agent_id = p_agent_id
  ORDER BY aa.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour récupérer les coopératives d'un agent
CREATE OR REPLACE FUNCTION get_agent_cooperatives(p_agent_id UUID)
RETURNS TABLE(
  cooperative_id UUID,
  cooperative_name TEXT,
  region TEXT,
  assigned_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as cooperative_id,
    c.name as cooperative_name,
    c.region,
    aa.assigned_at
  FROM agent_assignments aa
  JOIN cooperatives c ON aa.assigned_to_id = c.id
  WHERE aa.agent_id = p_agent_id 
  AND aa.assigned_to_type = 'cooperative'
  ORDER BY aa.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour supprimer une assignation
CREATE OR REPLACE FUNCTION remove_agent_assignment(
  p_agent_id UUID,
  p_assigned_to_type TEXT,
  p_assigned_to_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM agent_assignments 
  WHERE agent_id = p_agent_id 
  AND assigned_to_type = p_assigned_to_type
  AND assigned_to_id = p_assigned_to_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Nouvelle version de get_agent_producers avec logique unifiée
CREATE OR REPLACE FUNCTION get_agent_producers_unified(p_agent_id UUID)
RETURNS TABLE(
  producer_id UUID,
  producer_name TEXT,
  cooperative_name TEXT,
  assignment_type TEXT,
  assigned_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- Producteurs via assignation directe
  SELECT 
    p.id as producer_id, 
    CONCAT(p.first_name, ' ', p.last_name) as producer_name, 
    c.name as cooperative_name, 
    'direct'::TEXT as assignment_type,
    aa.assigned_at
  FROM agent_assignments aa
  JOIN producers p ON aa.assigned_to_id = p.id
  JOIN cooperatives c ON p.cooperative_id = c.id
  WHERE aa.agent_id = p_agent_id AND aa.assigned_to_type = 'producer'
  
  UNION
  
  -- Producteurs via assignation coopérative
  SELECT 
    p.id as producer_id, 
    CONCAT(p.first_name, ' ', p.last_name) as producer_name, 
    c.name as cooperative_name, 
    'cooperative'::TEXT as assignment_type,
    aa.assigned_at
  FROM agent_assignments aa
  JOIN cooperatives c ON aa.assigned_to_id = c.id
  JOIN producers p ON p.cooperative_id = c.id
  WHERE aa.agent_id = p_agent_id AND aa.assigned_to_type = 'cooperative'
  
  ORDER BY assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction pour récupérer les agents assignés à un producteur (nouvelle version)
CREATE OR REPLACE FUNCTION get_assigned_agents_for_producer_unified(p_producer_id UUID)
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  assignment_type TEXT,
  assigned_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- Agents assignés directement au producteur
  SELECT 
    aa.agent_id,
    p.display_name as agent_name,
    'direct'::TEXT as assignment_type,
    aa.assigned_at
  FROM agent_assignments aa
  JOIN profiles p ON aa.agent_id = p.id
  WHERE aa.assigned_to_type = 'producer' 
  AND aa.assigned_to_id = p_producer_id
  
  UNION
  
  -- Agents assignés à la coopérative du producteur
  SELECT 
    aa.agent_id,
    p.display_name as agent_name,
    'cooperative'::TEXT as assignment_type,
    aa.assigned_at
  FROM agent_assignments aa
  JOIN profiles p ON aa.agent_id = p.id
  JOIN producers prod ON prod.id = p_producer_id
  WHERE aa.assigned_to_type = 'cooperative' 
  AND aa.assigned_to_id = prod.cooperative_id
  
  ORDER BY assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction pour récupérer les agents disponibles (non assignés à un producteur spécifique)
CREATE OR REPLACE FUNCTION get_available_agents_for_producer(p_producer_id UUID)
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  region TEXT,
  is_assigned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as agent_id,
    p.display_name as agent_name,
    p.region,
    EXISTS (
      SELECT 1 FROM agent_assignments aa 
      WHERE aa.agent_id = p.id 
      AND (
        (aa.assigned_to_type = 'producer' AND aa.assigned_to_id = p_producer_id) OR
        (aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = (
          SELECT cooperative_id FROM producers WHERE id = p_producer_id
        ))
      )
    ) as is_assigned
  FROM profiles p
  WHERE p.role = 'agent'
  AND p.is_active = true
  ORDER BY p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Fonction pour récupérer les producteurs disponibles pour un agent
CREATE OR REPLACE FUNCTION get_available_producers_for_agent(p_agent_id UUID)
RETURNS TABLE(
  producer_id UUID,
  producer_name TEXT,
  cooperative_name TEXT,
  region TEXT,
  is_assigned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prod.id as producer_id,
    CONCAT(prod.first_name, ' ', prod.last_name) as producer_name,
    c.name as cooperative_name,
    c.region,
    EXISTS (
      SELECT 1 FROM agent_assignments aa 
      WHERE aa.agent_id = p_agent_id 
      AND (
        (aa.assigned_to_type = 'producer' AND aa.assigned_to_id = prod.id) OR
        (aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = c.id)
      )
    ) as is_assigned
  FROM producers prod
  JOIN cooperatives c ON prod.cooperative_id = c.id
  ORDER BY CONCAT(prod.first_name, ' ', prod.last_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Fonction pour obtenir les statistiques détaillées des assignations
CREATE OR REPLACE FUNCTION get_agent_assignments_detailed_stats(p_agent_id UUID DEFAULT NULL)
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  total_assignments BIGINT,
  direct_producer_assignments BIGINT,
  cooperative_assignments BIGINT,
  total_producers_covered BIGINT,
  total_cooperatives_covered BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as agent_id,
    p.display_name as agent_name,
    COUNT(aa.id) as total_assignments,
    COUNT(aa.id) FILTER (WHERE aa.assigned_to_type = 'producer') as direct_producer_assignments,
    COUNT(aa.id) FILTER (WHERE aa.assigned_to_type = 'cooperative') as cooperative_assignments,
    -- Calculer le nombre total de producteurs couverts (directs + via coopératives)
    (
      SELECT COUNT(DISTINCT prod.id)
      FROM producers prod
      WHERE EXISTS (
        SELECT 1 FROM agent_assignments aa2
        WHERE aa2.agent_id = p.id
        AND (
          (aa2.assigned_to_type = 'producer' AND aa2.assigned_to_id = prod.id) OR
          (aa2.assigned_to_type = 'cooperative' AND aa2.assigned_to_id = prod.cooperative_id)
        )
      )
    ) as total_producers_covered,
    COUNT(DISTINCT aa.assigned_to_id) FILTER (WHERE aa.assigned_to_type = 'cooperative') as total_cooperatives_covered
  FROM profiles p
  LEFT JOIN agent_assignments aa ON p.id = aa.agent_id
  WHERE p.role = 'agent'
  AND (p_agent_id IS NULL OR p.id = p_agent_id)
  GROUP BY p.id, p.display_name
  ORDER BY total_assignments DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
