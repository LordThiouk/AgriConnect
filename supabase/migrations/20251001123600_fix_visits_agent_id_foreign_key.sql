-- ============================================================================
-- FIX: Corriger les agent_id dans la table visits
-- ============================================================================
-- Problème: Les agent_id dans visits ne correspondent pas aux user_id des agents
-- Solution: Mettre à jour les agent_id pour qu'ils correspondent aux user_id
-- ============================================================================

-- 1. Désactiver temporairement la contrainte de clé étrangère
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_agent_id_fkey;

-- 2. Mettre à jour les agent_id pour qu'ils correspondent aux user_id des agents
UPDATE visits 
SET agent_id = profiles.user_id
FROM profiles 
WHERE visits.agent_id = profiles.id 
AND profiles.role = 'agent';

-- 3. Recréer la contrainte de clé étrangère
ALTER TABLE visits 
ADD CONSTRAINT visits_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Vérifier les mises à jour
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM visits v
    JOIN profiles p ON v.agent_id = p.user_id
    WHERE p.role = 'agent';
    
    RAISE NOTICE 'Visites mises à jour: %', updated_count;
END $$;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      AGENT_ID DANS VISITS CORRIGÉS                    ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements:';
  RAISE NOTICE '  ✓ agent_id mis à jour pour correspondre aux user_id';
  RAISE NOTICE '  ✓ Contrainte de clé étrangère recréée';
  RAISE NOTICE '  ✓ Les RPC get_agent_today_visits fonctionneront maintenant';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultat: Les agents verront maintenant leurs visites';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
