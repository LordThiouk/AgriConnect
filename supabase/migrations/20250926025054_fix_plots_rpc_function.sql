-- Corriger la fonction RPC pour récupérer les parcelles d'un producteur
-- La table principale est farm_file_plots, pas plots
CREATE OR REPLACE FUNCTION get_plots_by_producer(producer_id_param UUID)
RETURNS TABLE (
  id UUID,
  name_season_snapshot TEXT,
  area_hectares NUMERIC,
  producer_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ffp.id,
    ffp.name_season_snapshot,
    ffp.area_hectares,
    CONCAT(p.first_name, ' ', p.last_name) as producer_name
  FROM farm_file_plots ffp
  INNER JOIN farm_files ff ON ffp.farm_file_id = ff.id
  INNER JOIN producers p ON ff.responsible_producer_id = p.id
  WHERE ff.responsible_producer_id = producer_id_param
  ORDER BY ffp.name_season_snapshot;
END;
$$;

-- RLS pour la fonction
GRANT EXECUTE ON FUNCTION get_plots_by_producer(UUID) TO authenticated;
