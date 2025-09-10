-- Corriger la fonction RPC pour les alertes terrain
DROP FUNCTION IF EXISTS get_agent_terrain_alerts(uuid);

CREATE OR REPLACE FUNCTION get_agent_terrain_alerts(p_agent_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_producer_ids UUID[];
BEGIN
    -- Récupérer les IDs des producteurs assignés à l'agent
    SELECT array_agg(producer_id)
    INTO v_producer_ids
    FROM public.agent_producer_assignments
    WHERE agent_id = p_agent_id;

    -- Si aucun producteur assigné, retourner un tableau vide
    IF v_producer_ids IS NULL OR array_length(v_producer_ids, 1) = 0 THEN
        RETURN '[]'::json;
    END IF;

    -- Retourner les alertes terrain (observations avec maladies/ravageurs de sévérité >= 3)
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', 'alert_' || sub.id,
                'title', 'Maladie détectée',
                'description', sub.producer_name || ' - ' || COALESCE(sub.pest_disease_name, 'Problème détecté'),
                'severity', CASE 
                    WHEN sub.severity >= 4 THEN 'high'
                    ELSE 'medium'
                END,
                'plotId', sub.plot_id,
                'producerName', sub.producer_name,
                'createdAt', sub.observation_date
            )
        ), '[]'::json)
        FROM (
            SELECT 
                o.id,
                o.pest_disease_name,
                o.severity,
                o.plot_id,
                o.observation_date,
                p.first_name || ' ' || p.last_name as producer_name
            FROM public.observations o
            JOIN public.plots pl ON o.plot_id = pl.id
            JOIN public.producers p ON pl.producer_id = p.id
            WHERE pl.producer_id = ANY(v_producer_ids)
              AND o.pest_disease_name IS NOT NULL
              AND o.severity IS NOT NULL
              AND o.severity >= 3
            ORDER BY o.observation_date DESC
        ) sub
    );
END;
$$;
