-- ============================================================================
-- FIX: Politiques RLS pour agent_assignments
-- ============================================================================
-- Problème: Agents ne peuvent pas lire leurs assignations (requête retourne 0)
-- Solution: Créer des politiques pour permettre aux agents de voir leurs assignations
-- ============================================================================

-- 1. S'assurer que RLS est activé
ALTER TABLE public.agent_assignments ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Agents can view their own assignments" ON public.agent_assignments;
DROP POLICY IF EXISTS "Agents can view their assignments" ON public.agent_assignments;
DROP POLICY IF EXISTS "Supervisors and admins can view all assignments" ON public.agent_assignments;
DROP POLICY IF EXISTS "Supervisors and admins can manage assignments" ON public.agent_assignments;
DROP POLICY IF EXISTS "Agents can insert their own assignments" ON public.agent_assignments;
DROP POLICY IF EXISTS "Agents can update their own assignments" ON public.agent_assignments;
DROP POLICY IF EXISTS "Agents can delete their own assignments" ON public.agent_assignments;

-- 3. Créer les politiques correctes

-- SELECT: Agents voient leurs propres assignations
CREATE POLICY "Agents can view their own assignments"
ON public.agent_assignments
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

-- SELECT: Superviseurs/Admins voient toutes les assignations
CREATE POLICY "Supervisors and admins can view all assignments"
ON public.agent_assignments
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

-- INSERT: Superviseurs/Admins créent des assignations
CREATE POLICY "Supervisors and admins can insert assignments"
ON public.agent_assignments
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

-- UPDATE: Superviseurs/Admins modifient des assignations
CREATE POLICY "Supervisors and admins can update assignments"
ON public.agent_assignments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role IN ('supervisor', 'admin')
  )
);

-- DELETE: Superviseurs/Admins suppriment des assignations
CREATE POLICY "Supervisors and admins can delete assignments"
ON public.agent_assignments
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
  WHERE relname = 'agent_assignments' AND relnamespace = 'public'::regnamespace;
  
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'agent_assignments';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '      RLS CONFIGURE SUR agent_assignments';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS active: %', CASE WHEN rls_enabled THEN 'OUI' ELSE 'NON' END;
  RAISE NOTICE 'Nombre de politiques: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Politiques creees:';
  RAISE NOTICE '  - Agents: SELECT (leurs assignations seulement)';
  RAISE NOTICE '  - Superviseurs/Admins: SELECT/INSERT/UPDATE/DELETE (toutes)';
  RAISE NOTICE '';
  RAISE NOTICE 'Les agents peuvent maintenant lire leurs assignations';
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
END $$;

