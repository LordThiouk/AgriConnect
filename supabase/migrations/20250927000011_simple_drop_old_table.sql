-- Migration: Suppression simple de l'ancienne table
-- Objectif: Supprimer uniquement l'ancienne table agent_producer_assignments

-- 1. Supprimer complètement l'ancienne table avec CASCADE
DROP TABLE IF EXISTS public.agent_producer_assignments CASCADE;

-- 2. Vérification
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_producer_assignments'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'ERREUR: La table agent_producer_assignments existe encore';
    ELSE
        RAISE NOTICE 'SUCCÈS: La table agent_producer_assignments a été supprimée';
    END IF;
END $$;
