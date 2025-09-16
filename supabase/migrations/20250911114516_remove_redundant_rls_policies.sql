-- Supprime les politiques RLS sur les tables producers et plots qui sont maintenant
-- redondantes car la sécurité est gérée par la fonction RPC get_farm_files en mode SECURITY DEFINER.

DROP POLICY IF EXISTS "Agents can read their assigned producers" ON public.producers;

DROP POLICY IF EXISTS "Agents can view plots for their assigned producers" ON public.plots;
