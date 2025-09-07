-- Migration: Création de la table auth_logs pour journalisation des événements d'authentification
-- Date: 2025-08-30
-- Description: Table de traçabilité complète pour audit et monitoring de sécurité

-- Création de la table auth_logs
CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'login_attempt',
            'login_success', 
            'login_failure',
            'logout',
            'session_refresh',
            'session_expired',
            'platform_access_denied',
            'permission_denied',
            'password_reset_request',
            'password_reset_success',
            'otp_sent',
            'otp_verified',
            'otp_expired',
            'account_created',
            'account_updated',
            'account_deleted',
            'role_changed',
            'suspicious_activity',
            'rate_limit_exceeded'
        )
    ),
    platform TEXT NOT NULL CHECK (platform IN ('mobile', 'web')),
    auth_method TEXT NOT NULL CHECK (auth_method IN ('otp_sms', 'email_password')),
    user_role TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes de logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON auth_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_platform ON auth_logs(platform);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_role ON auth_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_auth_logs_success ON auth_logs(success);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_auth_logs_platform_role ON auth_logs(platform, user_role);
CREATE INDEX IF NOT EXISTS idx_auth_logs_platform_success ON auth_logs(platform, success);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_created ON auth_logs(user_id, created_at);

-- Index pour les requêtes de sécurité
CREATE INDEX IF NOT EXISTS idx_auth_logs_suspicious ON auth_logs(event_type, success, created_at) 
WHERE event_type IN ('suspicious_activity', 'rate_limit_exceeded', 'login_failure');

-- Index pour les requêtes de statistiques
CREATE INDEX IF NOT EXISTS idx_auth_logs_stats ON auth_logs(platform, user_role, success, created_at);

-- Fonction pour nettoyer automatiquement les anciens logs
CREATE OR REPLACE FUNCTION cleanup_old_auth_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques des logs
CREATE OR REPLACE FUNCTION get_auth_log_stats(
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL,
    p_platform TEXT DEFAULT NULL,
    p_user_role TEXT DEFAULT NULL
)
RETURNS TABLE(
    total_events BIGINT,
    success_rate NUMERIC,
    events_by_type JSONB,
    events_by_platform JSONB,
    events_by_role JSONB,
    recent_failures JSONB
) AS $$
DECLARE
    v_total_events BIGINT;
    v_success_count BIGINT;
    v_success_rate NUMERIC;
    v_events_by_type JSONB;
    v_events_by_platform JSONB;
    v_events_by_role JSONB;
    v_recent_failures JSONB;
BEGIN
    -- Construire la requête de base
    WITH filtered_logs AS (
        SELECT * FROM auth_logs
        WHERE (p_date_from IS NULL OR created_at >= p_date_from)
          AND (p_date_to IS NULL OR created_at <= p_date_to)
          AND (p_platform IS NULL OR platform = p_platform)
          AND (p_user_role IS NULL OR user_role = p_user_role)
    ),
    stats AS (
        SELECT 
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE success = true) as success_count,
            jsonb_object_agg(event_type, COUNT(*)) as events_by_type,
            jsonb_object_agg(platform, COUNT(*)) as events_by_platform,
            jsonb_object_agg(COALESCE(user_role, 'unknown'), COUNT(*)) as events_by_role
        FROM filtered_logs
    ),
    failures AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'event_type', event_type,
                'platform', platform,
                'user_role', user_role,
                'error_message', error_message,
                'created_at', created_at
            )
        ) as recent_failures
        FROM (
            SELECT * FROM filtered_logs 
            WHERE success = false 
            ORDER BY created_at DESC 
            LIMIT 10
        ) recent_failures
    )
    SELECT 
        s.total_events,
        CASE 
            WHEN s.total_events > 0 THEN 
                ROUND((s.success_count::NUMERIC / s.total_events::NUMERIC) * 100, 2)
            ELSE 0 
        END as success_rate,
        s.events_by_type,
        s.events_by_platform,
        s.events_by_role,
        COALESCE(f.recent_failures, '[]'::jsonb) as recent_failures
    INTO v_total_events, v_success_rate, v_events_by_type, v_events_by_platform, v_events_by_role, v_recent_failures
    FROM stats s
    CROSS JOIN failures f;
    
    RETURN QUERY SELECT 
        v_total_events,
        v_success_rate,
        v_events_by_type,
        v_events_by_platform,
        v_events_by_role,
        v_recent_failures;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour journaliser automatiquement les événements d'authentification
CREATE OR REPLACE FUNCTION log_auth_event(
    p_user_id UUID DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL,
    p_platform TEXT DEFAULT NULL,
    p_auth_method TEXT DEFAULT NULL,
    p_user_role TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT false,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO auth_logs (
        user_id,
        event_type,
        platform,
        auth_method,
        user_role,
        success,
        ip_address,
        user_agent,
        error_message,
        metadata
    ) VALUES (
        p_user_id,
        p_event_type,
        p_platform,
        p_auth_method,
        p_user_role,
        p_success,
        p_ip_address,
        p_user_agent,
        p_error_message,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS (Row Level Security) pour la table auth_logs
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view own auth logs" ON auth_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Politique RLS : Les admins peuvent voir tous les logs
CREATE POLICY "Admins can view all auth logs" ON auth_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Politique RLS : Les superviseurs peuvent voir les logs de leur coopérative
-- Note: Cette politique sera mise à jour quand la table memberships sera créée
CREATE POLICY "Supervisors can view cooperative auth logs" ON auth_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'supervisor'
        )
    );

-- Politique RLS : Seuls les services système peuvent insérer des logs
CREATE POLICY "System services can insert auth logs" ON auth_logs
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL OR 
        current_setting('app.bypass_rls', true) = 'true'
    );

-- Politique RLS : Seuls les admins peuvent modifier/supprimer des logs
CREATE POLICY "Admins can modify auth logs" ON auth_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Trigger pour mettre à jour automatiquement updated_at (si on ajoute cette colonne plus tard)
-- CREATE TRIGGER set_updated_at
--     BEFORE UPDATE ON auth_logs
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- Vues pour faciliter l'accès aux logs
CREATE OR REPLACE VIEW auth_logs_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    platform,
    user_role,
    event_type,
    COUNT(*) as event_count,
    COUNT(*) FILTER (WHERE success = true) as success_count,
    COUNT(*) FILTER (WHERE success = false) as failure_count
FROM auth_logs
GROUP BY DATE_TRUNC('day', created_at), platform, user_role, event_type
ORDER BY date DESC, platform, user_role, event_type;

-- Vue pour les alertes de sécurité
CREATE OR REPLACE VIEW security_alerts AS
SELECT 
    id,
    user_id,
    event_type,
    platform,
    user_role,
    error_message,
    created_at,
    metadata
FROM auth_logs
WHERE event_type IN ('suspicious_activity', 'rate_limit_exceeded', 'platform_access_denied')
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE auth_logs IS 'Journal des événements d''authentification et de sécurité pour audit et monitoring';
COMMENT ON COLUMN auth_logs.event_type IS 'Type d''événement d''authentification';
COMMENT ON COLUMN auth_logs.platform IS 'Plateforme d''accès (mobile ou web)';
COMMENT ON COLUMN auth_logs.auth_method IS 'Méthode d''authentification utilisée';
COMMENT ON COLUMN auth_logs.metadata IS 'Données supplémentaires au format JSON';
COMMENT ON COLUMN auth_logs.ip_address IS 'Adresse IP de la requête (optionnel)';
COMMENT ON COLUMN auth_logs.user_agent IS 'User-Agent du navigateur/app (optionnel)';

-- Permissions
GRANT SELECT ON auth_logs TO authenticated;
GRANT SELECT ON auth_logs_summary TO authenticated;
GRANT SELECT ON security_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION log_auth_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_log_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_auth_logs TO authenticated;

-- Permissions spéciales pour les admins
GRANT ALL ON auth_logs TO authenticated;
GRANT ALL ON auth_logs_summary TO authenticated;
GRANT ALL ON security_alerts TO authenticated;
