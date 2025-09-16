-- Ce script de migration ajoute des données de test de géolocalisation
-- pour jusqu'à 3 parcelles assignées à un agent de test spécifique.
-- ID Agent: d6daff9e-c1af-4a96-ab51-bd8925813890

DO $$
DECLARE
    agent_id_to_update uuid := 'd6daff9e-c1af-4a96-ab51-bd8925813890'::uuid;
    plot_ids_to_update uuid[];
BEGIN
    -- 1. Trouver jusqu'à 3 parcelles des producteurs assignés à l'agent
    SELECT ARRAY(
        SELECT ffp.id
        FROM farm_file_plots ffp
        JOIN agent_producer_assignments apa ON ffp.producer_id = apa.producer_id
        WHERE apa.agent_id = agent_id_to_update AND ffp.center_point IS NULL
        LIMIT 3
    ) INTO plot_ids_to_update;

    -- 2. Mettre à jour les coordonnées GPS si des parcelles ont été trouvées
    IF array_length(plot_ids_to_update, 1) > 0 THEN
        -- Parcelle 1 (près de Dakar)
        UPDATE farm_file_plots
        SET center_point = ST_SetSRID(ST_MakePoint(-17.46768, 14.7167), 4326)
        WHERE id = plot_ids_to_update[1];
        RAISE NOTICE 'Parcelle % mise à jour avec les coordonnées de Dakar.', plot_ids_to_update[1];

        -- Parcelle 2 (près de Thiès)
        IF array_length(plot_ids_to_update, 1) >= 2 THEN
            UPDATE farm_file_plots
            SET center_point = ST_SetSRID(ST_MakePoint(-16.93333, 14.78333), 4326)
            WHERE id = plot_ids_to_update[2];
            RAISE NOTICE 'Parcelle % mise à jour avec les coordonnées de Thiès.', plot_ids_to_update[2];
        END IF;
        
        -- Parcelle 3 (près de Kaolack)
        IF array_length(plot_ids_to_update, 1) >= 3 THEN
            UPDATE farm_file_plots
            SET center_point = ST_SetSRID(ST_MakePoint(-16.0744, 14.1453), 4326)
            WHERE id = plot_ids_to_update[3];
            RAISE NOTICE 'Parcelle % mise à jour avec les coordonnées de Kaolack.', plot_ids_to_update[3];
        END IF;
    ELSE
        RAISE WARNING 'Aucune parcelle sans GPS trouvée pour l''agent %. Veuillez vérifier l''ID de l''agent et les affectations, ou si les parcelles ont déjà des coordonnées.', agent_id_to_update;
    END IF;
END $$;
