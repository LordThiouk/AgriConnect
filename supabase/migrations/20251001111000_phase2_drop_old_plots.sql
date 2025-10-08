-- ============================================================================
-- PHASE 2: SUPPRESSION DE L'ANCIENNE TABLE PLOTS
-- ============================================================================
-- Date: 2025-10-01
-- Durée estimée: 10 minutes
-- Objectif: Supprimer l'ancienne table plots obsolète pour libérer le nom
--
-- ⚠️ ATTENTION: Opération destructive (backup créé en Phase 1)
--
-- Contexte:
-- - plots_obsolete_backup contient 29 lignes (backup créé en Phase 1)
-- - farm_file_plots contient toutes les données importantes
-- - Cette suppression libère le nom 'plots' pour le renommage de farm_file_plots
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATIONS DE SÉCURITÉ
-- ============================================================================

DO $$
BEGIN
  -- Vérifier que le backup existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'plots_obsolete_backup'
  ) THEN
    RAISE EXCEPTION 'ERREUR CRITIQUE: Backup plots_obsolete_backup introuvable. Migration annulée pour sécurité.';
  END IF;
  
  -- Vérifier le nombre de lignes dans le backup
  DECLARE
    v_backup_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_backup_count FROM public.plots_obsolete_backup;
    
    IF v_backup_count < 29 THEN
      RAISE EXCEPTION 'ERREUR: Backup incomplet (% lignes, attendu: 29). Migration annulée.', v_backup_count;
    END IF;
    
    RAISE NOTICE '✓ Backup vérifié: % lignes', v_backup_count;
  END;
  
  -- Vérifier que farm_file_plots existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'farm_file_plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR CRITIQUE: Table farm_file_plots introuvable. Migration annulée.';
  END IF;
  
  RAISE NOTICE '✓ Table farm_file_plots trouvée';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vérifications de sécurité RÉUSSIES';
  RAISE NOTICE 'Début de la suppression...';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 2. SUPPRESSION DES CONTRAINTES FK VERS PLOTS
-- ============================================================================

-- Note: Les contraintes FK seront supprimées automatiquement avec CASCADE
-- On documente ici les tables potentiellement affectées

DO $$
DECLARE
  v_constraint_count INTEGER := 0;
  r RECORD;
BEGIN
  RAISE NOTICE 'Recherche des contraintes FK vers plots...';
  
  -- Parcourir toutes les contraintes FK pointant vers plots
  FOR r IN 
    SELECT 
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'plots'
      AND tc.table_schema = 'public'
  LOOP
    v_constraint_count := v_constraint_count + 1;
    RAISE NOTICE '  → Table: %, Contrainte: %, Colonne: %', 
      r.table_name, r.constraint_name, r.column_name;
  END LOOP;
  
  IF v_constraint_count > 0 THEN
    RAISE NOTICE 'Trouvé % contrainte(s) FK - Seront supprimées avec CASCADE', v_constraint_count;
  ELSE
    RAISE NOTICE '✓ Aucune contrainte FK trouvée vers plots';
  END IF;
END $$;

-- ============================================================================
-- 3. SUPPRESSION DE LA TABLE PLOTS
-- ============================================================================

-- Compter les lignes avant suppression (pour logs)
DO $$
DECLARE
  v_plots_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plots_count FROM public.plots;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table plots à supprimer: % lignes', v_plots_count;
  RAISE NOTICE '========================================';
END $$;

-- Supprimer la table plots avec CASCADE
-- CASCADE supprimera automatiquement toutes les contraintes FK et dépendances
DROP TABLE IF EXISTS public.plots CASCADE;

-- ============================================================================
-- 4. VÉRIFICATIONS POST-SUPPRESSION
-- ============================================================================

DO $$
BEGIN
  -- Vérifier que plots n'existe plus
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR: La table plots existe encore. Suppression échouée.';
  END IF;
  
  RAISE NOTICE '✓ Table plots supprimée avec succès';
  
  -- Vérifier que le backup existe toujours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'plots_obsolete_backup'
  ) THEN
    RAISE EXCEPTION 'ERREUR CRITIQUE: Backup disparu après suppression!';
  END IF;
  
  RAISE NOTICE '✓ Backup préservé: plots_obsolete_backup';
  
  -- Vérifier que farm_file_plots existe toujours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'farm_file_plots'
  ) THEN
    RAISE EXCEPTION 'ERREUR CRITIQUE: farm_file_plots disparu!';
  END IF;
  
  DECLARE
    v_ffp_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_ffp_count FROM public.farm_file_plots;
    RAISE NOTICE '✓ farm_file_plots préservée: % lignes', v_ffp_count;
  END;
END $$;

-- ============================================================================
-- 5. RÉSUMÉ ET STATISTIQUES
-- ============================================================================

DO $$
DECLARE
  v_backup_count INTEGER;
  v_ffp_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_backup_count FROM public.plots_obsolete_backup;
  SELECT COUNT(*) INTO v_ffp_count FROM public.farm_file_plots;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PHASE 2 TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table plots supprimée: ✓';
  RAISE NOTICE 'Backup préservé: % lignes', v_backup_count;
  RAISE NOTICE 'farm_file_plots active: % lignes', v_ffp_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Nom "plots" maintenant disponible pour renommage';
  RAISE NOTICE 'Prochaine étape: Phase 3 - Renommer farm_file_plots → plots';
  RAISE NOTICE '========================================';
END $$;

