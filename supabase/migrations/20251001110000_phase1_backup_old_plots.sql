-- ============================================================================
-- PHASE 1: BACKUP DE L'ANCIENNE TABLE PLOTS
-- ============================================================================
-- Date: 2025-10-01
-- Durée estimée: 15 minutes
-- Objectif: Créer une sauvegarde de sécurité avant suppression
--
-- Contexte:
-- - farm_file_plots est l'ancienne table plots (renommée)
-- - plots actuelle est obsolète (29 lignes: 8 tests + 21 prod dont 6 doublons)
-- - Aucune donnée unique à migrer (tout est déjà dans farm_file_plots)
-- ============================================================================

-- Vérifier que la table plots existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Table plots introuvable. Migration annulée.';
  END IF;
  
  RAISE NOTICE 'Table plots trouvée - Création du backup...';
END $$;

-- Créer la table de backup
CREATE TABLE IF NOT EXISTS public.plots_obsolete_backup AS 
SELECT * FROM public.plots;

-- Ajouter des métadonnées sur la table
COMMENT ON TABLE public.plots_obsolete_backup IS 
  'Backup de l''ancienne table plots avant migration vers farm_file_plots (2025-10-01).
   Contenu: 29 lignes dont 8 données de test (producer_id NULL) et 21 données production.
   Note: 6 parcelles production existent déjà dans farm_file_plots avec correspondance exacte.
   Cette table peut être supprimée après validation complète de la migration.';

-- Créer un index sur id pour faciliter les recherches
CREATE INDEX IF NOT EXISTS idx_plots_backup_id 
  ON public.plots_obsolete_backup(id);

-- Ajouter une colonne de metadata
ALTER TABLE public.plots_obsolete_backup
  ADD COLUMN IF NOT EXISTS backup_date TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.plots_obsolete_backup.backup_date IS 
  'Date de création du backup';

-- Statistiques du backup
DO $$
DECLARE
  v_total_rows INTEGER;
  v_null_producer INTEGER;
  v_with_producer INTEGER;
BEGIN
  -- Compter les lignes
  SELECT COUNT(*) INTO v_total_rows 
  FROM public.plots_obsolete_backup;
  
  SELECT COUNT(*) INTO v_null_producer 
  FROM public.plots_obsolete_backup 
  WHERE producer_id IS NULL;
  
  SELECT COUNT(*) INTO v_with_producer 
  FROM public.plots_obsolete_backup 
  WHERE producer_id IS NOT NULL;
  
  -- Afficher les statistiques
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKUP CRÉÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total lignes sauvegardées: %', v_total_rows;
  RAISE NOTICE 'Données de test (producer_id NULL): %', v_null_producer;
  RAISE NOTICE 'Données production (avec producer): %', v_with_producer;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table: public.plots_obsolete_backup';
  RAISE NOTICE 'Prochaine étape: Phase 2 - Suppression de l''ancienne table plots';
  RAISE NOTICE '========================================';
END $$;

-- Grant permissions (lecture seule)
GRANT SELECT ON public.plots_obsolete_backup TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.plots_obsolete_backup FROM authenticated;

-- Vérification finale
DO $$
DECLARE
  v_backup_count INTEGER;
  v_original_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_backup_count FROM public.plots_obsolete_backup;
  SELECT COUNT(*) INTO v_original_count FROM public.plots;
  
  IF v_backup_count != v_original_count THEN
    RAISE WARNING 'ATTENTION: Le nombre de lignes diffère (backup: %, original: %)', 
      v_backup_count, v_original_count;
  ELSE
    RAISE NOTICE '✓ Vérification: Backup complet (% lignes)', v_backup_count;
  END IF;
END $$;

