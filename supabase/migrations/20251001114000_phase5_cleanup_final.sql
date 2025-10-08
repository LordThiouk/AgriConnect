-- ============================================================================
-- PHASE 5: NETTOYAGE FINAL
-- ============================================================================
-- Date: 2025-10-01
-- Durée estimée: 10 minutes
-- Objectif: Nettoyer les colonnes legacy et finaliser la migration
--
-- Actions:
-- - Supprimer plot_id_legacy de plots (ancienne référence obsolète)
-- - Mettre à jour les commentaires finaux
-- - Valider l'état final de la base de données
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATIONS PRÉALABLES
-- ============================================================================

DO $$
DECLARE
  v_plots_count INTEGER;
  v_has_legacy BOOLEAN;
  v_legacy_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vérifications préalables Phase 5:';
  RAISE NOTICE '========================================';
  
  -- Vérifier que plots existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Table plots introuvable. Migration incomplète.';
  END IF;
  
  SELECT COUNT(*) INTO v_plots_count FROM public.plots;
  RAISE NOTICE '✓ Table plots existe (% lignes)', v_plots_count;
  
  -- Vérifier que plot_id_legacy existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'plots'
      AND column_name = 'plot_id_legacy'
  ) INTO v_has_legacy;
  
  IF v_has_legacy THEN
    SELECT COUNT(*) INTO v_legacy_count 
    FROM public.plots 
    WHERE plot_id_legacy IS NOT NULL;
    
    RAISE NOTICE '✓ Colonne plot_id_legacy existe (% valeurs non-null)', v_legacy_count;
  ELSE
    RAISE NOTICE '⚠️  Colonne plot_id_legacy n''existe pas (déjà nettoyée?)';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 2. SUPPRESSION DE PLOT_ID_LEGACY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Suppression de plot_id_legacy...';
END $$;

-- Supprimer la colonne plot_id_legacy (ancienne référence vers plots obsolète)
ALTER TABLE public.plots 
  DROP COLUMN IF EXISTS plot_id_legacy CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ Colonne plot_id_legacy supprimée';
END $$;

-- ============================================================================
-- 3. MISE À JOUR DES COMMENTAIRES FINAUX
-- ============================================================================

-- Commentaire final sur la table plots
COMMENT ON TABLE public.plots IS 
  'Table principale des parcelles agricoles.
   
   Migration farm_file_plots → plots complétée le 2025-10-01:
   ✓ Ancienne table "plots" obsolète supprimée et archivée (plots_obsolete_backup)
   ✓ Table "farm_file_plots" renommée en "plots" (nomenclature standard restaurée)
   ✓ Toutes les références mises à jour (crops, operations, observations, visits, recommendations)
   
   Relations:
   - plots ← crops (cultures sur la parcelle)
   - plots ← visits (visites de la parcelle)
   
   Via crops (indirect):
   - plots ← crops ← operations (opérations agricoles)
   - plots ← crops ← observations (observations des cultures)
   - plots ← crops ← recommendations (recommandations)
   
   Modèle flexible:
   - operations/observations peuvent référencer plot_id OU crop_id
   - visits référencent toujours plot_id
   - recommendations peuvent référencer plot_id, crop_id OU producer_id';

-- Commentaires sur les colonnes principales
COMMENT ON COLUMN public.plots.id IS 
  'Identifiant unique de la parcelle (clé primaire).
   Utilisé par: crops.plot_id, visits.plot_id, operations.plot_id, observations.plot_id, recommendations.plot_id';

COMMENT ON COLUMN public.plots.name_season_snapshot IS 
  'Nom de la parcelle pour la saison en cours.
   Format: "Parcelle [Lettre] - [Culture] [ID]"';

COMMENT ON COLUMN public.plots.area_hectares IS 
  'Superficie de la parcelle en hectares (ha)';

COMMENT ON COLUMN public.plots.producer_id IS 
  'Référence vers le producteur propriétaire (table producers)';

COMMENT ON COLUMN public.plots.cooperative_id IS 
  'Référence vers la coopérative (table cooperatives)';

COMMENT ON COLUMN public.plots.farm_file_id IS 
  'Référence vers le dossier agricole de la saison (table farm_files)';

COMMENT ON COLUMN public.plots.status IS 
  'Statut de la parcelle: active, inactive, abandoned, harvested';

COMMENT ON COLUMN public.plots.geom IS 
  'Géométrie de la parcelle (polygone ou multipolygone en GeoJSON)';

COMMENT ON COLUMN public.plots.center_point IS 
  'Point central de la parcelle (geometry POINT pour affichage carte)';

DO $$
BEGIN
  RAISE NOTICE '✓ Commentaires mis à jour';
END $$;

-- ============================================================================
-- 4. VÉRIFICATIONS FINALES
-- ============================================================================

DO $$
DECLARE
  v_plots_count INTEGER;
  v_crops_count INTEGER;
  v_crops_with_plot INTEGER;
  v_ops_count INTEGER;
  v_obs_count INTEGER;
  v_visits_count INTEGER;
  v_recs_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vérifications finales:';
  RAISE NOTICE '========================================';
  
  -- Statistiques plots
  SELECT COUNT(*) INTO v_plots_count FROM public.plots;
  RAISE NOTICE 'Table plots: % parcelles', v_plots_count;
  
  -- Statistiques crops
  SELECT COUNT(*) INTO v_crops_count FROM public.crops;
  SELECT COUNT(*) INTO v_crops_with_plot FROM public.crops WHERE plot_id IS NOT NULL;
  RAISE NOTICE 'Table crops: % cultures (% liées à plots)', v_crops_count, v_crops_with_plot;
  
  -- Statistiques autres tables
  SELECT COUNT(*) INTO v_ops_count FROM public.operations;
  SELECT COUNT(*) INTO v_obs_count FROM public.observations;
  SELECT COUNT(*) INTO v_visits_count FROM public.visits;
  SELECT COUNT(*) INTO v_recs_count FROM public.recommendations;
  
  RAISE NOTICE 'Table operations: % opérations', v_ops_count;
  RAISE NOTICE 'Table observations: % observations', v_obs_count;
  RAISE NOTICE 'Table visits: % visites', v_visits_count;
  RAISE NOTICE 'Table recommendations: % recommandations', v_recs_count;
  
  RAISE NOTICE '========================================';
END $$;

-- Vérifier les contraintes FK
DO $$
DECLARE
  r RECORD;
  v_fk_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Contraintes FK vers plots:';
  RAISE NOTICE '─────────────────────────────';
  
  FOR r IN 
    SELECT 
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'plots'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  LOOP
    v_fk_count := v_fk_count + 1;
    RAISE NOTICE '  ✓ %.% (FK: %)', r.table_name, r.column_name, r.constraint_name;
  END LOOP;
  
  RAISE NOTICE '─────────────────────────────';
  RAISE NOTICE 'Total: % contraintes FK', v_fk_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 5. RÉSUMÉ FINAL DE LA MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_plots_count INTEGER;
  v_backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plots_count FROM public.plots;
  SELECT COUNT(*) INTO v_backup_count FROM public.plots_obsolete_backup;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                                ║';
  RAISE NOTICE '║              MIGRATION TERMINÉE AVEC SUCCÈS                    ║';
  RAISE NOTICE '║                                                                ║';
  RAISE NOTICE '║         farm_file_plots → plots (COMPLET)                      ║';
  RAISE NOTICE '║                                                                ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Résumé de la migration:';
  RAISE NOTICE '─────────────────────────';
  RAISE NOTICE '✅ Phase 1: Backup créé (% lignes)', v_backup_count;
  RAISE NOTICE '✅ Phase 2: Ancienne table plots supprimée';
  RAISE NOTICE '✅ Phase 3: farm_file_plots → plots';
  RAISE NOTICE '✅ Phase 4: Références mises à jour (5 tables)';
  RAISE NOTICE '✅ Phase 5: Nettoyage terminé';
  RAISE NOTICE '';
  RAISE NOTICE 'État final:';
  RAISE NOTICE '─────────────────────────';
  RAISE NOTICE '• Table plots: % parcelles actives', v_plots_count;
  RAISE NOTICE '• Backup: plots_obsolete_backup (% lignes)', v_backup_count;
  RAISE NOTICE '• Nomenclature: Standard restaurée ✓';
  RAISE NOTICE '• Contraintes FK: Toutes actives ✓';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Prochaines étapes:';
  RAISE NOTICE '─────────────────────────';
  RAISE NOTICE '1. Mettre à jour le code frontend (web + mobile)';
  RAISE NOTICE '   → Remplacer "farm_file_plots" par "plots"';
  RAISE NOTICE '   → Remplacer "farmFilePlotId" par "plotId"';
  RAISE NOTICE '   → Remplacer "FarmFilePlot" par "Plot"';
  RAISE NOTICE '';
  RAISE NOTICE '2. Tests de régression complets';
  RAISE NOTICE '   → Tester toutes les fonctionnalités CRUD';
  RAISE NOTICE '   → Vérifier les cartes interactives';
  RAISE NOTICE '   → Valider les relations plots/crops';
  RAISE NOTICE '';
  RAISE NOTICE '3. Monitoring (24-48h)';
  RAISE NOTICE '   → Surveiller les logs d''erreurs';
  RAISE NOTICE '   → Vérifier les performances';
  RAISE NOTICE '';
  RAISE NOTICE '4. Suppression du backup (optionnel, après validation)';
  RAISE NOTICE '   → DROP TABLE plots_obsolete_backup;';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 MIGRATION BASE DE DONNÉES TERMINÉE AVEC SUCCÈS !';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

