-- Fix foreign key constraint for recommendations.plot_id
-- The constraint should point to plots.id, not farm_file_plots.id

-- 1. Vérifier les contraintes actuelles
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'recommendations'
  AND tc.table_schema = 'public';

-- 2. Supprimer la contrainte incorrecte
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_plot_id_fkey;

-- 3. Ajouter la bonne contrainte vers plots.id
ALTER TABLE recommendations 
ADD CONSTRAINT recommendations_plot_id_fkey 
FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE SET NULL;

-- 4. Vérifier que la contrainte a été corrigée
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'recommendations'
  AND kcu.column_name = 'plot_id'
  AND tc.table_schema = 'public';

-- 5. D'abord, créer les règles agricoles manquantes
INSERT INTO agri_rules (
    id, code, name, description, condition_sql, action_type, action_message, severity, is_active, created_at, updated_at
) VALUES 
(gen_random_uuid(), 'RULE_MAIZE_001', 'Règle Maïs Fertilisation', 'Condition pour la fertilisation du maïs', 'crop_type = ''Maïs''', 'recommendation', 'Appliquer 50kg/ha d''urée', 'warning', true, NOW(), NOW()),
(gen_random_uuid(), 'RULE_RICE_001', 'Règle Riz Irrigation', 'Condition pour l''irrigation du riz', 'crop_type = ''Riz''', 'notification', 'Maintenir hauteur d''eau 5-10cm', 'info', true, NOW(), NOW()),
(gen_random_uuid(), 'RULE_CASSAVA_001', 'Règle Manioc Contrôle Ravageurs', 'Condition pour le contrôle des ravageurs du manioc', 'crop_type = ''Manioc''', 'recommendation', 'Surveiller les attaques de cochenilles', 'critical', true, NOW(), NOW()),
(gen_random_uuid(), 'RULE_GENERIC_001', 'Règle Générale', 'Règle générale pour toutes les cultures', 'growth_stage IN (''vegetative'', ''flowering'')', 'recommendation', 'Vérifier l''état général de la culture', 'info', true, NOW(), NOW()),
(gen_random_uuid(), 'RULE_PLOT_001', 'Règle Amélioration du Sol', 'Règle pour l''amélioration de la structure du sol', 'soil_organic_matter < 2.0', 'recommendation', 'Appliquer du compost', 'info', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 6. Maintenant, ajouter les recommandations de test
INSERT INTO recommendations (
    id,
    crop_id,
    plot_id,
    producer_id,
    rule_code,
    title,
    message,
    recommendation_type,
    priority,
    status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    c.id as crop_id,
    p.id as plot_id,
    pr.id as producer_id,
    CASE 
        WHEN c.crop_type = 'Maïs' THEN 'RULE_MAIZE_001'
        WHEN c.crop_type = 'Riz' THEN 'RULE_RICE_001'
        WHEN c.crop_type = 'Manioc' THEN 'RULE_CASSAVA_001'
        ELSE 'RULE_GENERIC_001'
    END as rule_code,
    CASE 
        WHEN c.crop_type = 'Maïs' THEN 'Fertilisation Azotée Maïs'
        WHEN c.crop_type = 'Riz' THEN 'Irrigation Riz'
        WHEN c.crop_type = 'Manioc' THEN 'Contrôle des Ravageurs Manioc'
        ELSE 'Recommandation Générale'
    END as title,
    CASE 
        WHEN c.crop_type = 'Maïs' THEN 'Appliquer 50kg/ha d''urée au stade V6'
        WHEN c.crop_type = 'Riz' THEN 'Maintenir une hauteur d''eau de 5-10cm'
        WHEN c.crop_type = 'Manioc' THEN 'Surveiller les attaques de cochenilles'
        ELSE 'Vérifier l''état général de la culture'
    END as message,
    CASE 
        WHEN c.crop_type = 'Maïs' THEN 'fertilisation'
        WHEN c.crop_type = 'Riz' THEN 'irrigation'
        WHEN c.crop_type = 'Manioc' THEN 'pest_control'
        ELSE 'other'
    END as recommendation_type,
    CASE 
        WHEN RANDOM() < 0.2 THEN 'urgent'
        WHEN RANDOM() < 0.4 THEN 'high'
        WHEN RANDOM() < 0.7 THEN 'medium'
        ELSE 'low'
    END as priority,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'pending'
        WHEN RANDOM() < 0.6 THEN 'sent'
        WHEN RANDOM() < 0.8 THEN 'acknowledged'
        ELSE 'completed'
    END as status,
    NOW() - (RANDOM() * INTERVAL '30 days') as created_at,
    NOW() - (RANDOM() * INTERVAL '10 days') as updated_at
FROM crops c
JOIN plots p ON c.plot_id = p.id
JOIN producers pr ON p.producer_id = pr.id
WHERE c.crop_type IN ('Maïs', 'Riz', 'Manioc', 'Arachide')
LIMIT 15;

-- 6. Ajouter quelques recommandations au niveau parcelle
INSERT INTO recommendations (
    id,
    plot_id,
    producer_id,
    rule_code,
    title,
    message,
    recommendation_type,
    priority,
    status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    p.id as plot_id,
    pr.id as producer_id,
    'RULE_PLOT_001' as rule_code,
    'Amélioration du Sol' as title,
    'Appliquer du compost pour améliorer la structure du sol' as message,
    'fertilisation' as recommendation_type,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'medium'
        ELSE 'low'
    END as priority,
    CASE 
        WHEN RANDOM() < 0.4 THEN 'pending'
        WHEN RANDOM() < 0.7 THEN 'sent'
        ELSE 'acknowledged'
    END as status,
    NOW() - (RANDOM() * INTERVAL '20 days') as created_at,
    NOW() - (RANDOM() * INTERVAL '5 days') as updated_at
FROM plots p
JOIN producers pr ON p.producer_id = pr.id
WHERE p.id NOT IN (SELECT DISTINCT plot_id FROM recommendations WHERE plot_id IS NOT NULL)
LIMIT 8;

-- 7. Afficher les résultats finaux
DO $$
DECLARE
    total_recommendations INTEGER;
    total_agri_rules INTEGER;
    by_type RECORD;
    by_priority RECORD;
    by_status RECORD;
BEGIN
    SELECT COUNT(*) INTO total_recommendations FROM recommendations;
    SELECT COUNT(*) INTO total_agri_rules FROM agri_rules;
    
    RAISE NOTICE '=== RÉSULTATS FINAUX ===';
    RAISE NOTICE 'Total agri_rules: %', total_agri_rules;
    RAISE NOTICE 'Total recommendations: %', total_recommendations;
    
    RAISE NOTICE 'Recommendations par type:';
    FOR by_type IN 
        SELECT recommendation_type, COUNT(*) as count 
        FROM recommendations 
        GROUP BY recommendation_type 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  %: %', by_type.recommendation_type, by_type.count;
    END LOOP;
    
    RAISE NOTICE 'Recommendations par priorité:';
    FOR by_priority IN 
        SELECT priority, COUNT(*) as count 
        FROM recommendations 
        GROUP BY priority 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  %: %', by_priority.priority, by_priority.count;
    END LOOP;
    
    RAISE NOTICE 'Recommendations par statut:';
    FOR by_status IN 
        SELECT status, COUNT(*) as count 
        FROM recommendations 
        GROUP BY status 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  %: %', by_status.status, by_status.count;
    END LOOP;
END $$;
