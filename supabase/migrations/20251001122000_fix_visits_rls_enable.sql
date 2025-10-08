-- ============================================================================
-- FIX: Activer RLS sur la table visits et corriger les politiques
-- ============================================================================
-- Problème: UPDATE/DELETE fonctionne sans authentification (client anon)
-- Solution: Vérifier et activer RLS + recréer les politiques correctes
-- ============================================================================

-- 1. S'assurer que RLS est activé
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes pour repartir à zéro
DROP POLICY IF EXISTS "Agents can view their own visits" ON public.visits;
DROP POLICY IF EXISTS "Agents can insert their own visits" ON public.visits;
DROP POLICY IF EXISTS "Agents can update their own visits" ON public.visits;
DROP POLICY IF EXISTS "Agents can delete their own visits" ON public.visits;
DROP POLICY IF EXISTS "Supervisors and admins can view all visits" ON public.visits;
DROP POLICY IF EXISTS "Supervisors and admins can insert visits" ON public.visits;
DROP POLICY IF EXISTS "Supervisors and admins can update visits" ON public.visits;
DROP POLICY IF EXISTS "Supervisors and admins can delete visits" ON public.visits;

-- 3. Créer les politiques correctes avec mapping auth.uid() → profiles.user_id → profiles.id → visits.agent_id

-- SELECT: Agents voient leurs visites
CREATE POLICY "Agents can view their own visits"
ON public.visits
FOR SELECT
TO authenticated
USING (
  agent_id IN (
    SELECT p.id 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role = 'agent'
  )
);

-- INSERT: Agents créent leurs visites
CREATE POLICY "Agents can insert their own visits"
ON public.visits
FOR INSERT
TO authenticated
WITH CHECK (
  agent_id IN (
    SELECT p.id 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role = 'agent'
  )
);

-- UPDATE: Agents modifient leurs visites
CREATE POLICY "Agents can update their own visits"
ON public.visits
FOR UPDATE
TO authenticated
USING (
  agent_id IN (
    SELECT p.id 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role = 'agent'
  )
)
WITH CHECK (
  agent_id IN (
    SELECT p.id 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role = 'agent'
  )
);

-- DELETE: Agents suppriment leurs visites
CREATE POLICY "Agents can delete their own visits"
ON public.visits
FOR DELETE
TO authenticated
USING (
  agent_id IN (
    SELECT p.id 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role = 'agent'
  )
);

-- SELECT: Superviseurs/Admins voient toutes les visites
CREATE POLICY "Supervisors and admins can view all visits"
ON public.visits
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('supervisor', 'admin')
  )
);

-- INSERT: Superviseurs/Admins créent des visites
CREATE POLICY "Supervisors and admins can insert visits"
ON public.visits
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('supervisor', 'admin')
  )
);

-- UPDATE: Superviseurs/Admins modifient toutes les visites
CREATE POLICY "Supervisors and admins can update visits"
ON public.visits
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('supervisor', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('supervisor', 'admin')
  )
);

-- DELETE: Superviseurs/Admins suppriment toutes les visites
CREATE POLICY "Supervisors and admins can delete visits"
ON public.visits
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('supervisor', 'admin')
  )
);

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Vérifier RLS
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'visits' AND relnamespace = 'public'::regnamespace;
  
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'visits';
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '║      RLS ACTIVÉ SUR TABLE VISITS                      ║';
  RAISE NOTICE '║                                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS activé: %', CASE WHEN rls_enabled THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Nombre de politiques: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Politiques créées:';
  RAISE NOTICE '  ✓ Agents: SELECT/INSERT/UPDATE/DELETE (leurs visites)';
  RAISE NOTICE '  ✓ Superviseurs/Admins: SELECT/INSERT/UPDATE/DELETE (toutes)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Les utilisateurs DOIVENT être authentifiés';
  RAISE NOTICE '   Les clients anonymes N''ONT PLUS ACCES a la table';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

