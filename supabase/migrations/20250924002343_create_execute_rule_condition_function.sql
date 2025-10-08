-- Migration: Création de la fonction RPC execute_rule_condition
-- Date: 2025-01-24
-- Description: Fonction pour exécuter dynamiquement les conditions SQL des règles agricoles
-- Basée sur la structure réelle: farm_file_plots → farm_files → profiles

-- Créer la fonction execute_rule_condition
CREATE OR REPLACE FUNCTION execute_rule_condition(rule_condition TEXT)
RETURNS TABLE (
  producer_id UUID,
  producer_name TEXT,
  crop_name TEXT,
  plot_name TEXT,
  days INTEGER,
  additional_data JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Exécuter la condition SQL fournie et retourner les résultats
  RETURN QUERY EXECUTE rule_condition;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur et retourner un résultat vide en cas d'erreur
    RAISE WARNING 'Erreur lors de l''exécution de la règle: %', SQLERRM;
    RETURN;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION execute_rule_condition(TEXT) IS 
'Fonction pour exécuter dynamiquement les conditions SQL des règles agricoles. 
Retourne les producteurs affectés par une règle avec leurs informations détaillées.
Structure: farm_file_plots → farm_files → profiles (producteurs)';

-- Exemple d'utilisation de la fonction avec la vraie structure
-- SELECT * FROM execute_rule_condition('
--   SELECT 
--     p.id as producer_id,
--     p.first_name || '' '' || p.last_name as producer_name,
--     ffp.crop_type as crop_name,
--     ffp.name_season_snapshot as plot_name,
--     EXTRACT(DAYS FROM (CURRENT_DATE - ffp.sowing_date)) as days,
--     jsonb_build_object(
--       ''farm_file_plot_id'', ffp.id,
--       ''sowing_date'', ffp.sowing_date,
--       ''fertilizer_type'', ''NPK 15-15-15'',
--       ''quantity_per_hectare'', 200
--     ) as additional_data
--   FROM farm_file_plots ffp
--   JOIN farm_files ff ON ffp.farm_file_id = ff.id
--   JOIN profiles p ON ff.producer_id = p.id
--   WHERE ffp.sowing_date IS NOT NULL
--     AND EXTRACT(DAYS FROM (CURRENT_DATE - ffp.sowing_date)) = 7
--     AND ffp.status = ''active''
--     AND NOT EXISTS (
--       SELECT 1 FROM operations o 
--       WHERE o.farm_file_plot_id = ffp.id 
--       AND o.operation_type = ''fertilization''
--       AND o.operation_date >= ffp.sowing_date
--     )
-- ');
