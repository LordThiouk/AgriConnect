-- ============================================================================
-- PHASE 3: RENOMMAGE DE FARM_FILE_PLOTS → PLOTS
-- ============================================================================
-- Date: 2025-10-01
-- Durée estimée: 5 minutes
-- Objectif: Renommer farm_file_plots en plots pour restaurer la nomenclature standard
--
-- Contexte:
-- - farm_file_plots est l'ancienne table plots qui avait été renommée
-- - L'ancienne table plots obsolète a été supprimée en Phase 2
-- - Cette opération restaure le nom correct "plots"
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATIONS PRÉALABLES
-- ============================================================================

DO $$
BEGIN
  -- Vérifier que farm_file_plots existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'farm_file_plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR CRITIQUE: Table farm_file_plots introuvable. Migration annulée.';
  END IF;
  
  -- Vérifier que plots n'existe plus
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Table plots existe encore. Phase 2 non complétée. Migration annulée.';
  END IF;
  
  -- Vérifier le backup
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'plots_obsolete_backup'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Backup introuvable. Migration annulée pour sécurité.';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vérifications préalables RÉUSSIES';
  RAISE NOTICE '✓ farm_file_plots existe';
  RAISE NOTICE '✓ plots n''existe plus';
  RAISE NOTICE '✓ Backup préservé';
  RAISE NOTICE '========================================';
END $$;

-- Afficher les statistiques avant renommage
DO $$
DECLARE
  v_ffp_count INTEGER;
  v_column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_ffp_count FROM public.farm_file_plots;
  
  SELECT COUNT(*) INTO v_column_count 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'farm_file_plots';
  
  RAISE NOTICE 'Table à renommer:';
  RAISE NOTICE '  → farm_file_plots: % lignes, % colonnes', v_ffp_count, v_column_count;
END $$;

-- ============================================================================
-- 2. RENOMMAGE DE LA TABLE PRINCIPALE
-- ============================================================================

-- Renommer farm_file_plots → plots
ALTER TABLE public.farm_file_plots 
  RENAME TO plots;

DO $$
BEGIN
  RAISE NOTICE '✓ Table renommée: farm_file_plots → plots';
END $$;

-- ============================================================================
-- 3. RENOMMAGE DE LA COLONNE PLOT_ID → PLOT_ID_LEGACY
-- ============================================================================

-- La colonne plot_id référençait l'ancienne table plots (maintenant supprimée)
-- On la renomme en plot_id_legacy pour clarifier qu'elle est obsolète
ALTER TABLE public.plots 
  RENAME COLUMN plot_id TO plot_id_legacy;

DO $$
BEGIN
  RAISE NOTICE '✓ Colonne renommée: plot_id → plot_id_legacy';
END $$;

-- ============================================================================
-- 4. MISE À JOUR DES COMMENTAIRES
-- ============================================================================

-- Commentaire sur la table
COMMENT ON TABLE public.plots IS 
  'Table principale des parcelles agricoles (farm_file_plots).
   
   Histoire:
   - Anciennement nommée "farm_file_plots" 
   - Renommée en "plots" le 2025-10-01 pour restaurer la nomenclature standard
   - L''ancienne table "plots" (obsolète) a été supprimée et archivée dans plots_obsolete_backup
   
   Cette table contient toutes les données détaillées des parcelles:
   - Informations de base (nom, superficie, producteur)
   - Caractéristiques du sol (type, pH, pente)
   - Irrigation et eau
   - Géolocalisation (geometry + center_point)
   - Statut et notes';

-- Commentaire sur la colonne plot_id_legacy
COMMENT ON COLUMN public.plots.plot_id_legacy IS 
  'Ancienne référence vers la table "plots" obsolète (supprimée en Phase 2).
   
   Cette colonne:
   - Contenait des références vers l''ancienne table plots (29 lignes, supprimée)
   - Est maintenant obsolète car la table référencée n''existe plus
   - Sera supprimée en Phase 5 après validation complète
   - Ne doit PAS être utilisée dans le nouveau code
   
   Pour référencer une parcelle, utiliser directement: plots.id';

-- Commentaire sur les colonnes clés
COMMENT ON COLUMN public.plots.id IS 
  'Identifiant unique de la parcelle (clé primaire).
   À utiliser pour toutes les relations avec cette table.';

COMMENT ON COLUMN public.plots.name_season_snapshot IS 
  'Nom de la parcelle pour la saison actuelle.
   Format typique: "Parcelle [A-Z] - [Culture] [ID]"';

COMMENT ON COLUMN public.plots.area_hectares IS 
  'Superficie de la parcelle en hectares (ha)';

COMMENT ON COLUMN public.plots.producer_id IS 
  'Référence vers le producteur propriétaire (table producers)';

COMMENT ON COLUMN public.plots.farm_file_id IS 
  'Référence vers le dossier agricole parent (table farm_files)';

-- ============================================================================
-- 5. VÉRIFICATIONS POST-RENOMMAGE
-- ============================================================================

DO $$
DECLARE
  v_plots_count INTEGER;
  v_column_count INTEGER;
  v_has_plot_id_legacy BOOLEAN;
BEGIN
  -- Vérifier que plots existe maintenant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Table plots non créée. Renommage échoué.';
  END IF;
  
  -- Vérifier que farm_file_plots n'existe plus
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'farm_file_plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Table farm_file_plots existe encore. Renommage échoué.';
  END IF;
  
  -- Vérifier la colonne plot_id_legacy
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'plots'
      AND column_name = 'plot_id_legacy'
  ) INTO v_has_plot_id_legacy;
  
  IF NOT v_has_plot_id_legacy THEN
    RAISE EXCEPTION 'ERREUR: Colonne plot_id_legacy non créée. Renommage colonne échoué.';
  END IF;
  
  -- Statistiques finales
  SELECT COUNT(*) INTO v_plots_count FROM public.plots;
  
  SELECT COUNT(*) INTO v_column_count 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'plots';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vérifications post-renommage:';
  RAISE NOTICE '✓ Table plots existe';
  RAISE NOTICE '✓ farm_file_plots n''existe plus';
  RAISE NOTICE '✓ Colonne plot_id_legacy créée';
  RAISE NOTICE '✓ Données préservées: % lignes', v_plots_count;
  RAISE NOTICE '✓ Structure préservée: % colonnes', v_column_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 6. RÉSUMÉ ET STATISTIQUES FINALES
-- ============================================================================

DO $$
DECLARE
  v_plots_count INTEGER;
  v_backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plots_count FROM public.plots;
  SELECT COUNT(*) INTO v_backup_count FROM public.plots_obsolete_backup;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║         PHASE 3 TERMINÉE AVEC SUCCÈS                   ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Renommage effectué:';
  RAISE NOTICE '  farm_file_plots → plots ✓';
  RAISE NOTICE '  plot_id → plot_id_legacy ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'État actuel:';
  RAISE NOTICE '  • Table plots: % lignes', v_plots_count;
  RAISE NOTICE '  • Backup: % lignes', v_backup_count;
  RAISE NOTICE '  • Nomenclature standard restaurée ✓';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Prochaine étape: Phase 4';
  RAISE NOTICE 'Renommer farm_file_plot_id → plot_id';
  RAISE NOTICE 'dans les tables dépendantes';
  RAISE NOTICE '========================================';
END $$;

