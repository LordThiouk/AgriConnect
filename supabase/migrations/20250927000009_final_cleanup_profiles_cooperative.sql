-- Migration: Nettoyage final de la colonne cooperative dans profiles
-- Objectif: Supprimer progressivement les dépendances puis la colonne

-- 1. Supprimer le trigger qui dépend de la colonne cooperative
DROP TRIGGER IF EXISTS validate_and_sync_profile_trigger ON public.profiles;

-- 2. Supprimer la politique qui dépend de la colonne cooperative
DROP POLICY IF EXISTS "Agents can insert producers in their cooperative" ON public.producers;

-- 3. Maintenant supprimer la colonne cooperative
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cooperative;

-- 4. Vérification finale
DO $$
DECLARE
    remaining_profiles_cooperative INTEGER;
BEGIN
    -- Vérifier qu'il n'y a plus de colonne cooperative dans profiles
    SELECT COUNT(*) INTO remaining_profiles_cooperative
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'cooperative' 
    AND table_schema = 'public';
    
    IF remaining_profiles_cooperative > 0 THEN
        RAISE NOTICE 'ATTENTION: La colonne cooperative existe encore dans profiles';
    ELSE
        RAISE NOTICE 'SUCCÈS: La colonne cooperative a été supprimée de profiles';
    END IF;
END $$;
