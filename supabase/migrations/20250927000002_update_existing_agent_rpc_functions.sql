-- Migration: Mise à jour des RPC functions existantes pour utiliser la nouvelle table agent_assignments
-- Objectif: Adapter les fonctions existantes à la nouvelle logique unifiée

-- 1. Supprimer l'ancienne fonction et créer la nouvelle version
DROP FUNCTION IF EXISTS get_agent_producers(UUID);

CREATE FUNCTION get_agent_producers(p_agent_id UUID)
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

-- 2. Mettre à jour assign_producer_to_agent pour utiliser la nouvelle table
DROP FUNCTION IF EXISTS assign_producer_to_agent(UUID, UUID, UUID);

CREATE FUNCTION assign_producer_to_agent(
  p_agent_id UUID,
  p_producer_id UUID,
  p_assigned_by UUID DEFAULT NULL
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
  
  -- Créer l'assignation dans la nouvelle table
  INSERT INTO agent_assignments (agent_id, assigned_to_type, assigned_to_id, assigned_by)
  VALUES (p_agent_id, 'producer', p_producer_id, COALESCE(p_assigned_by, auth.uid()))
  ON CONFLICT (agent_id, assigned_to_type, assigned_to_id) DO NOTHING;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Mettre à jour unassign_producer_from_agent pour utiliser la nouvelle table
DROP FUNCTION IF EXISTS unassign_producer_from_agent(UUID, UUID);

CREATE FUNCTION unassign_producer_from_agent(
  p_agent_id UUID,
  p_producer_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM agent_assignments 
  WHERE agent_id = p_agent_id 
  AND assigned_to_type = 'producer'
  AND assigned_to_id = p_producer_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Mettre à jour get_assigned_agents_for_producer pour utiliser la nouvelle logique
DROP FUNCTION IF EXISTS get_assigned_agents_for_producer(UUID);

CREATE FUNCTION get_assigned_agents_for_producer(p_producer_id UUID)
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

-- 5. Mettre à jour get_available_agents pour inclure la logique des coopératives
DROP FUNCTION IF EXISTS get_available_agents();

CREATE FUNCTION get_available_agents()
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  region TEXT,
  cooperative_name TEXT,
  is_active BOOLEAN,
  approval_status TEXT,
  total_assignments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as agent_id,
    p.display_name as agent_name,
    p.region,
    -- Récupérer le nom de la coopérative principale (première assignation coopérative)
    (
      SELECT c.name 
      FROM agent_assignments aa
      JOIN cooperatives c ON aa.assigned_to_id = c.id
      WHERE aa.agent_id = p.id 
      AND aa.assigned_to_type = 'cooperative'
      ORDER BY aa.assigned_at ASC
      LIMIT 1
    ) as cooperative_name,
    p.is_active,
    p.approval_status,
    COUNT(aa.id) as total_assignments
  FROM profiles p
  LEFT JOIN agent_assignments aa ON p.id = aa.agent_id
  WHERE p.role = 'agent'
  GROUP BY p.id, p.display_name, p.region, p.is_active, p.approval_status
  ORDER BY p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Mettre à jour get_available_producers pour inclure la logique des assignations
DROP FUNCTION IF EXISTS get_available_producers(UUID);

CREATE FUNCTION get_available_producers(p_agent_id UUID DEFAULT NULL)
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
    CASE 
      WHEN p_agent_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM agent_assignments aa 
        WHERE aa.agent_id = p_agent_id 
        AND (
          (aa.assigned_to_type = 'producer' AND aa.assigned_to_id = prod.id) OR
          (aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = c.id)
        )
      )
    END as is_assigned
  FROM producers prod
  JOIN cooperatives c ON prod.cooperative_id = c.id
  ORDER BY CONCAT(prod.first_name, ' ', prod.last_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Mettre à jour get_agent_performance pour inclure les nouvelles assignations
DROP FUNCTION IF EXISTS get_agent_performance(UUID);

CREATE FUNCTION get_agent_performance(p_agent_id UUID)
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  total_producers BIGINT,
  direct_producer_assignments BIGINT,
  cooperative_assignments BIGINT,
  total_farm_files BIGINT,
  completed_farm_files BIGINT,
  completion_rate NUMERIC,
  total_visits BIGINT,
  recent_visits BIGINT,
  total_observations BIGINT,
  recent_observations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as agent_id,
    p.display_name as agent_name,
    -- Nombre total de producteurs couverts (directs + via coopératives)
    (
      SELECT COUNT(DISTINCT prod.id)
      FROM producers prod
      WHERE EXISTS (
        SELECT 1 FROM agent_assignments aa
        WHERE aa.agent_id = p.id
        AND (
          (aa.assigned_to_type = 'producer' AND aa.assigned_to_id = prod.id) OR
          (aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = prod.cooperative_id)
        )
      )
    ) as total_producers,
    -- Assignations directes aux producteurs
    COUNT(aa.id) FILTER (WHERE aa.assigned_to_type = 'producer') as direct_producer_assignments,
    -- Assignations aux coopératives
    COUNT(aa.id) FILTER (WHERE aa.assigned_to_type = 'cooperative') as cooperative_assignments,
    -- Statistiques des fiches
    COUNT(ff.id) as total_farm_files,
    COUNT(ff.id) FILTER (WHERE ff.status = 'completed') as completed_farm_files,
    CASE 
      WHEN COUNT(ff.id) > 0 THEN 
        ROUND((COUNT(ff.id) FILTER (WHERE ff.status = 'completed') * 100.0 / COUNT(ff.id)), 2)
      ELSE 0
    END as completion_rate,
    -- Statistiques des visites
    COUNT(v.id) as total_visits,
    COUNT(v.id) FILTER (WHERE v.visit_date >= CURRENT_DATE - INTERVAL '30 days') as recent_visits,
    -- Statistiques des observations
    COUNT(o.id) as total_observations,
    COUNT(o.id) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_observations
  FROM profiles p
  LEFT JOIN agent_assignments aa ON p.id = aa.agent_id
  LEFT JOIN producers prod ON (
    (aa.assigned_to_type = 'producer' AND aa.assigned_to_id = prod.id) OR
    (aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = prod.cooperative_id)
  )
  LEFT JOIN farm_files ff ON ff.producer_id = prod.id
  LEFT JOIN visits v ON v.agent_id = p.id
  LEFT JOIN observations o ON o.agent_id = p.id
  WHERE p.id = p_agent_id
  GROUP BY p.id, p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Mettre à jour get_agents_stats pour inclure les nouvelles métriques
DROP FUNCTION IF EXISTS get_agents_stats();

CREATE FUNCTION get_agents_stats()
RETURNS TABLE(
  total_agents BIGINT,
  active_agents BIGINT,
  pending_approval_agents BIGINT,
  approved_agents BIGINT,
  total_assignments BIGINT,
  direct_producer_assignments BIGINT,
  cooperative_assignments BIGINT,
  total_producers_covered BIGINT,
  avg_assignments_per_agent NUMERIC,
  avg_producers_per_agent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(p.id) as total_agents,
    COUNT(p.id) FILTER (WHERE p.is_active = true) as active_agents,
    COUNT(p.id) FILTER (WHERE p.approval_status = 'pending') as pending_approval_agents,
    COUNT(p.id) FILTER (WHERE p.approval_status = 'approved') as approved_agents,
    COUNT(aa.id) as total_assignments,
    COUNT(aa.id) FILTER (WHERE aa.assigned_to_type = 'producer') as direct_producer_assignments,
    COUNT(aa.id) FILTER (WHERE aa.assigned_to_type = 'cooperative') as cooperative_assignments,
    -- Nombre total de producteurs couverts par tous les agents
    (
      SELECT COUNT(DISTINCT prod.id)
      FROM producers prod
      WHERE EXISTS (
        SELECT 1 FROM agent_assignments aa2
        JOIN profiles p2 ON aa2.agent_id = p2.id
        WHERE p2.role = 'agent'
        AND (
          (aa2.assigned_to_type = 'producer' AND aa2.assigned_to_id = prod.id) OR
          (aa2.assigned_to_type = 'cooperative' AND aa2.assigned_to_id = prod.cooperative_id)
        )
      )
    ) as total_producers_covered,
    -- Moyennes
    CASE 
      WHEN COUNT(p.id) > 0 THEN ROUND(COUNT(aa.id)::NUMERIC / COUNT(p.id), 2)
      ELSE 0
    END as avg_assignments_per_agent,
    CASE 
      WHEN COUNT(p.id) > 0 THEN ROUND(
        (
          SELECT COUNT(DISTINCT prod.id)
          FROM producers prod
          WHERE EXISTS (
            SELECT 1 FROM agent_assignments aa2
            JOIN profiles p2 ON aa2.agent_id = p2.id
            WHERE p2.role = 'agent'
            AND (
              (aa2.assigned_to_type = 'producer' AND aa2.assigned_to_id = prod.id) OR
              (aa2.assigned_to_type = 'cooperative' AND aa2.assigned_to_id = prod.cooperative_id)
            )
          )
        )::NUMERIC / COUNT(p.id), 2
      )
      ELSE 0
    END as avg_producers_per_agent
  FROM profiles p
  LEFT JOIN agent_assignments aa ON p.id = aa.agent_id
  WHERE p.role = 'agent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
