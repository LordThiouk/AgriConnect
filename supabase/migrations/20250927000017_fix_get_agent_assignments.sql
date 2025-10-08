-- Migration: Correction de la fonction get_agent_assignments
-- Objectif: Corriger l'erreur de colonne pb.first_name

DROP FUNCTION IF EXISTS get_agent_assignments(uuid);
CREATE OR REPLACE FUNCTION get_agent_assignments(p_agent_id uuid)
RETURNS TABLE(
  id uuid,
  assigned_to_type text,
  assigned_to_id uuid,
  assigned_at timestamptz,
  assigned_by uuid,
  assigned_to_name text,
  assigned_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.id,
        aa.assigned_to_type,
        aa.assigned_to_id,
        aa.assigned_at,
        aa.assigned_by,
        CASE 
            WHEN aa.assigned_to_type = 'producer' THEN 
                CONCAT(p.first_name, ' ', p.last_name)
            WHEN aa.assigned_to_type = 'cooperative' THEN 
                c.name
            ELSE 'Inconnu'
        END as assigned_to_name,
        CASE 
            WHEN aa.assigned_by IS NOT NULL THEN 
                pb.display_name
            ELSE NULL
        END as assigned_by_name
    FROM public.agent_assignments aa
    LEFT JOIN public.producers p ON aa.assigned_to_type = 'producer' AND aa.assigned_to_id = p.id
    LEFT JOIN public.cooperatives c ON aa.assigned_to_type = 'cooperative' AND aa.assigned_to_id = c.id
    LEFT JOIN public.profiles pb ON aa.assigned_by = pb.id
    WHERE aa.agent_id = p_agent_id
    ORDER BY aa.assigned_at DESC;
END;
$$;

-- Mettre à jour les permissions
GRANT EXECUTE ON FUNCTION get_agent_assignments(uuid) TO authenticated;
