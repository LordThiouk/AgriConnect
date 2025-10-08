-- Migration pour corriger les politiques RLS pour l'accès admin/web et mobile
-- Date: 2025-09-25
-- Permet l'accès aux agents, producteurs et admins selon leurs rôles

-- ===== COOPERATIVES =====
-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "cooperatives_select_policy" ON cooperatives;
DROP POLICY IF EXISTS "cooperatives_insert_policy" ON cooperatives;
DROP POLICY IF EXISTS "cooperatives_update_policy" ON cooperatives;
DROP POLICY IF EXISTS "cooperatives_delete_policy" ON cooperatives;

-- Créer de nouvelles politiques pour permettre l'accès selon les rôles
-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "cooperatives_select_policy" ON cooperatives
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Insertion/Update/Delete : seulement admins et superviseurs
CREATE POLICY "cooperatives_insert_policy" ON cooperatives
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'supervisor')
        )
    );

CREATE POLICY "cooperatives_update_policy" ON cooperatives
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'supervisor')
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'supervisor')
        )
    );

CREATE POLICY "cooperatives_delete_policy" ON cooperatives
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'supervisor')
        )
    );

-- ===== PROFILES =====
-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Créer de nouvelles politiques pour permettre l'accès admin/web
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE
    USING (true);

-- ===== CROPS =====
-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "crops_select_policy" ON crops;
DROP POLICY IF EXISTS "crops_insert_policy" ON crops;
DROP POLICY IF EXISTS "crops_update_policy" ON crops;
DROP POLICY IF EXISTS "crops_delete_policy" ON crops;

-- Créer de nouvelles politiques pour permettre l'accès admin/web
CREATE POLICY "crops_select_policy" ON crops
    FOR SELECT
    USING (true);

CREATE POLICY "crops_insert_policy" ON crops
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "crops_update_policy" ON crops
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "crops_delete_policy" ON crops
    FOR DELETE
    USING (true);

-- ===== RECOMMENDATIONS =====
-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "recommendations_select_policy" ON recommendations;
DROP POLICY IF EXISTS "recommendations_insert_policy" ON recommendations;
DROP POLICY IF EXISTS "recommendations_update_policy" ON recommendations;
DROP POLICY IF EXISTS "recommendations_delete_policy" ON recommendations;

-- Créer de nouvelles politiques pour permettre l'accès admin/web
CREATE POLICY "recommendations_select_policy" ON recommendations
    FOR SELECT
    USING (true);

CREATE POLICY "recommendations_insert_policy" ON recommendations
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "recommendations_update_policy" ON recommendations
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "recommendations_delete_policy" ON recommendations
    FOR DELETE
    USING (true);

-- ===== NOTIFICATIONS =====
-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

-- Créer de nouvelles politiques pour permettre l'accès admin/web
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT
    USING (true);

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE
    USING (true);

-- ===== AGENT_PRODUCER_ASSIGNMENTS =====
-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "agent_producer_assignments_select_policy" ON agent_producer_assignments;
DROP POLICY IF EXISTS "agent_producer_assignments_insert_policy" ON agent_producer_assignments;
DROP POLICY IF EXISTS "agent_producer_assignments_update_policy" ON agent_producer_assignments;
DROP POLICY IF EXISTS "agent_producer_assignments_delete_policy" ON agent_producer_assignments;

-- Créer de nouvelles politiques pour permettre l'accès admin/web
CREATE POLICY "agent_producer_assignments_select_policy" ON agent_producer_assignments
    FOR SELECT
    USING (true);

CREATE POLICY "agent_producer_assignments_insert_policy" ON agent_producer_assignments
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "agent_producer_assignments_update_policy" ON agent_producer_assignments
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "agent_producer_assignments_delete_policy" ON agent_producer_assignments
    FOR DELETE
    USING (true);

-- Commentaires pour documentation
COMMENT ON POLICY "cooperatives_select_policy" ON cooperatives IS 'Permet l acces en lecture a toutes les cooperatives pour l interface admin/web';
COMMENT ON POLICY "cooperatives_insert_policy" ON cooperatives IS 'Permet la creation de cooperatives pour l interface admin/web';
COMMENT ON POLICY "cooperatives_update_policy" ON cooperatives IS 'Permet la mise a jour des cooperatives pour l interface admin/web';
COMMENT ON POLICY "cooperatives_delete_policy" ON cooperatives IS 'Permet la suppression des cooperatives pour l interface admin/web';

COMMENT ON POLICY "profiles_select_policy" ON profiles IS 'Permet l acces en lecture a tous les profils pour l interface admin/web';
COMMENT ON POLICY "profiles_insert_policy" ON profiles IS 'Permet la creation de profils pour l interface admin/web';
COMMENT ON POLICY "profiles_update_policy" ON profiles IS 'Permet la mise a jour des profils pour l interface admin/web';
COMMENT ON POLICY "profiles_delete_policy" ON profiles IS 'Permet la suppression des profils pour l interface admin/web';

COMMENT ON POLICY "crops_select_policy" ON crops IS 'Permet l acces en lecture a toutes les cultures pour l interface admin/web';
COMMENT ON POLICY "crops_insert_policy" ON crops IS 'Permet la creation de cultures pour l interface admin/web';
COMMENT ON POLICY "crops_update_policy" ON crops IS 'Permet la mise a jour des cultures pour l interface admin/web';
COMMENT ON POLICY "crops_delete_policy" ON crops IS 'Permet la suppression des cultures pour l interface admin/web';

COMMENT ON POLICY "recommendations_select_policy" ON recommendations IS 'Permet l acces en lecture a toutes les recommandations pour l interface admin/web';
COMMENT ON POLICY "recommendations_insert_policy" ON recommendations IS 'Permet la creation de recommandations pour l interface admin/web';
COMMENT ON POLICY "recommendations_update_policy" ON recommendations IS 'Permet la mise a jour des recommandations pour l interface admin/web';
COMMENT ON POLICY "recommendations_delete_policy" ON recommendations IS 'Permet la suppression des recommandations pour l interface admin/web';

COMMENT ON POLICY "notifications_select_policy" ON notifications IS 'Permet l acces en lecture a toutes les notifications pour l interface admin/web';
COMMENT ON POLICY "notifications_insert_policy" ON notifications IS 'Permet la creation de notifications pour l interface admin/web';
COMMENT ON POLICY "notifications_update_policy" ON notifications IS 'Permet la mise a jour des notifications pour l interface admin/web';
COMMENT ON POLICY "notifications_delete_policy" ON notifications IS 'Permet la suppression des notifications pour l interface admin/web';

COMMENT ON POLICY "agent_producer_assignments_select_policy" ON agent_producer_assignments IS 'Permet l acces en lecture a toutes les assignations agent-producteur pour l interface admin/web';
COMMENT ON POLICY "agent_producer_assignments_insert_policy" ON agent_producer_assignments IS 'Permet la creation d assignations agent-producteur pour l interface admin/web';
COMMENT ON POLICY "agent_producer_assignments_update_policy" ON agent_producer_assignments IS 'Permet la mise a jour des assignations agent-producteur pour l interface admin/web';
COMMENT ON POLICY "agent_producer_assignments_delete_policy" ON agent_producer_assignments IS 'Permet la suppression des assignations agent-producteur pour l interface admin/web';
